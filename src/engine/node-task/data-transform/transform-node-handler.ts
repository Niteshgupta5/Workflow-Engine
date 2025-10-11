import _ from "lodash";
import { add, format, isValid, parseISO, sub } from "date-fns";

import { Node } from "@prisma/client";

import {
  AggregationOperation,
  ComparisonOperator,
  ConcatRule,
  CopyRule,
  DateOperation,
  DateFormatRule,
  DateOperationRule,
  ExecutionStatus,
  FilterRule,
  FormatType,
  GroupRule,
  MapRule,
  MergeRule,
  MergeStrategy,
  RemoveRule,
  RenameRule,
  SplitRule,
  TaskStatus,
  TimestampOperation,
  TimestampRule,
  TimeUnit,
  TransformationRuleMap,
  TransformationType,
  ConvertTypeRule,
  CodeBlockRule,
  AggregateRule,
  DataObject,
  ConversionType,
  NodeEdgesCondition,
} from "../../../types";

import {
  getDataTransformNodeById,
  getNextNodeId,
  logTaskExecution,
  updateTaskLog,
} from "../../../services";

import { executeCodeBlock, resolveTemplate } from "../../../utils";

export type TransformationHandler<T extends keyof TransformationRuleMap> = (
  data: any,
  rules: TransformationRuleMap[T],
  context: Record<string, any>
) => string | number | DataObject;

export const transformationHandlers: {
  [K in keyof TransformationRuleMap]: TransformationHandler<K>;
} = {
  [TransformationType.MAP]: (data, rules: { map: MapRule[] }, context) => {
    const { map } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => mapObject(item, map));
    }

    return mapObject(data, map);
  },

  [TransformationType.RENAME]: (data, rules: RenameRule, context) => {
    const { from, to } = rules;

    const mapping = from && to ? { [from]: to } : {};

    if (Array.isArray(data)) {
      return data.map((item) => renameKeys(item, mapping));
    }

    return renameKeys(data, mapping);
  },

  [TransformationType.REMOVE]: (data, rules: RemoveRule, context) => {
    const { fields = [] } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => removeKeys(item, fields));
    }

    return removeKeys(data, fields);
  },

  [TransformationType.FILTER]: (data, rules: FilterRule, context) => {
    const { condition } = rules;

    // Support both conditions array and single condition string
    if (condition && typeof condition === "string") {
      const conditionResult = resolveTemplate(condition, { ...context, data });
      return conditionResult ? data : null;
    }
  },

  [TransformationType.CODE_BLOCK]: async (data, rules: CodeBlockRule, context) => {
    const { expression, language } = rules;
    const codeToExecute = expression;

    if (!codeToExecute) {
      throw new Error("No code or expression provided");
    }

    const execContext = {
      ...context,
      data,
      input: data,
      _,
    };

    const resolvedCode = resolveTemplate(codeToExecute, execContext, true);
    const result = await executeCodeBlock(resolvedCode, language);

    return result;
  },

  [TransformationType.CONVERT_TYPE]: (data, rules: ConvertTypeRule, context) => {
    const { field, toType } = rules;

    const conversionMap = { [field]: toType };

    if (Array.isArray(data)) {
      return data.map((item) => convertTypes(item, conversionMap));
    }

    return convertTypes(data, conversionMap);
  },

  [TransformationType.MERGE]: (data, rules: MergeRule, context) => {
    let result = Array.isArray(data) ? [...data] : { ...data };

    const { source, target, strategy = MergeStrategy.SHALLOW } = rules;

    // Get the object(s) to merge
    let objectToMerge;
    if (source.startsWith("{{") && source.endsWith("}}")) {
      objectToMerge = resolveTemplate(source, context);
    } else {
      objectToMerge = getNestedValue(data, source);
    }

    // Apply strategy
    let merged;
    if (strategy === MergeStrategy.DEEP) {
      merged = _.merge({}, getNestedValue(result, target) || {}, objectToMerge);
    } else {
      merged = Object.assign({}, getNestedValue(result, target) || {}, objectToMerge);
    }

    // Set merged value to target
    setNestedValue(result, target, merged);

    return result;
  },

  [TransformationType.SPLIT]: (data, rules: SplitRule, context) => {
    const { field, separator = ",", target, limit, trim = true } = rules;
    const sep = separator;

    const value = field ? getNestedValue(data, field) : data;

    let result: any;

    if (typeof value === "string") {
      let parts = limit ? value.split(sep, limit) : value.split(sep);
      result = trim ? parts.map((p) => p.trim()) : parts;
    } else if (Array.isArray(value)) {
      result = limit ? value.slice(0, limit) : value;
    } else {
      result = value;
    }

    if (target) {
      const output = Array.isArray(data) ? [...data] : { ...data };
      setNestedValue(output, target, result);
      return output;
    }

    return result;
  },

  [TransformationType.DATE_FORMAT]: (data, rules: DateFormatRule, context) => {
    const { field, format: formatStr = "ISO", target, timezone } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => formatDateField(item, field, formatStr, target, timezone));
    }

    return formatDateField(data, field, formatStr, target, timezone);
  },

  [TransformationType.DATE_OPERATION]: (data, rules: DateOperationRule, context) => {
    const { field, operation, value, unit = TimeUnit.DAYS, target } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => performDateOperation(item, field, operation, value, unit, target));
    }

    return performDateOperation(data, field, operation, value, unit, target);
  },

  [TransformationType.TIMESTAMP]: (data, rules: TimestampRule, context) => {
    const {
      field,
      target,
      operation = TimestampOperation.TO_TIMESTAMP,
      unit = TimeUnit.MILLISECONDS,
    } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => handleTimestamp(item, field, operation, unit, target));
    }

    return handleTimestamp(data, field, operation, unit, target);
  },

  [TransformationType.COPY]: (data, rules: CopyRule, context) => {
    const { from, to } = rules;
    const sourceField = from;
    const targetField = to;

    if (!sourceField || !targetField) {
      throw new Error("Copy requires 'from' and 'to' fields");
    }

    if (Array.isArray(data)) {
      return data.map((item) => {
        const result = { ...item };
        const value = getNestedValue(item, sourceField);
        setNestedValue(result, targetField, value);
        return result;
      });
    }

    const result = { ...data };
    const value = getNestedValue(data, sourceField);
    setNestedValue(result, targetField, value);
    return result;
  },

  [TransformationType.AGGREGATE]: (data, rules: AggregateRule, context) => {
    const { groupBy = [], operations = [] } = rules;

    if (!Array.isArray(data)) {
      throw new Error("Aggregate requires array data");
    }

    // Support multiple operations with grouping
    if (groupBy.length > 0) {
      const grouped = _.groupBy(data, (item) =>
        groupBy.map((key: string) => getNestedValue(item, key)).join("|")
      );

      return Object.entries(grouped).map(([key, items]) => {
        const groupKeys = key.split("|");
        const result: any = {};

        groupBy.forEach((field: string, i: number) => {
          result[field] = groupKeys[i];
        });

        operations.forEach((op: any) => {
          const aggResult = aggregate(items, op.type, op.field);
          result[op.target || op.field] = aggResult;
        });

        return result;
      });
    }

    // No grouping, just aggregate operations
    const result: any = {};
    operations.forEach((op: any) => {
      const aggResult = aggregate(data, op.type, op.field);
      result[op.target || op.field] = aggResult;
    });

    return result;
  },

  [TransformationType.GROUP]: (data, rules: GroupRule, context) => {
    const { groupBy = [] } = rules;

    if (!Array.isArray(data)) {
      throw new Error("Group requires array data");
    }

    if (groupBy.length === 0) {
      throw new Error("Group requires at least one groupBy field");
    }

    if (groupBy.length === 1) {
      return _.groupBy(data, (item) => getNestedValue(item, groupBy[0]));
    }

    return _.groupBy(data, (item) =>
      groupBy.map((key: string) => getNestedValue(item, key)).join("|")
    );
  },

  [TransformationType.CONCAT]: (data, rules: ConcatRule, context) => {
    const { sources = [], target, separator = "" } = rules;

    if (!target) {
      throw new Error("Concat requires a 'target' field");
    }

    const concatenate = (item: any) => {
      const values = sources.map((source: string) => {
        const value = getNestedValue(item, source);
        return value != null ? String(value) : "";
      });

      const concatenated = values.join(separator);
      const result = { ...item };
      setNestedValue(result, target, concatenated);
      return result;
    };

    if (Array.isArray(data)) {
      return data.map(concatenate);
    }

    return concatenate(data);
  },
};

// ============================================================================
// NESTED PATH UTILITIES
// ============================================================================

export const getNestedValue = <T = unknown>(obj: unknown, path: string): T | undefined => {
  if (!path || obj == null) return obj as T | undefined;

  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj) as T | undefined;
};

export const setNestedValue = (obj: DataObject, path: string, value: unknown): void => {
  if (!path || obj == null) return;

  const parts = path.split(".");
  const last = parts.pop();

  if (!last) return;

  const target = parts.reduce<DataObject>((acc, part) => {
    if (acc[part] == null || typeof acc[part] !== "object") {
      acc[part] = {};
    }
    return acc[part] as DataObject;
  }, obj);

  target[last] = value;
};

export const hasNestedPath = (obj: unknown, path: string): boolean => {
  if (!path || obj == null || typeof obj !== "object") return false;

  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return false;
    }

    const currentObj = current as Record<string, unknown>;
    if (!(part in currentObj)) {
      return false;
    }
    current = currentObj[part];
  }

  return true;
};

export const deleteNestedPath = (obj: DataObject, path: string): boolean => {
  if (!path || obj == null) return false;

  const parts = path.split(".");
  const last = parts.pop();

  if (!last) return false;

  if (parts.length === 0) {
    return delete obj[last];
  }

  const parent = getNestedValue<DataObject>(obj, parts.join("."));

  if (parent && typeof parent === "object") {
    return delete parent[last];
  }

  return false;
};

// ============================================================================
// OBJECT TRANSFORMATION
// ============================================================================

export const mapObject = (obj: DataObject, mapping: MapRule[]): DataObject => {
  if (obj == null || typeof obj !== "object") {
    throw new Error("mapObject requires a valid object");
  }

  const result: DataObject = {};

  for (const map of mapping) {
    const value = getNestedValue(obj, map.source);

    if (map.target.includes(".")) {
      setNestedValue(result, map.target, value);
    } else {
      result[map.target] = value;
    }
  }

  return result;
};

export const renameKeys = (obj: DataObject, mapping: Record<string, string>): DataObject => {
  if (obj == null || typeof obj !== "object") {
    return obj;
  }

  return Object.entries(obj).reduce<DataObject>((acc, [key, value]) => {
    const newKey = mapping[key] ?? key;
    acc[newKey] = value;
    return acc;
  }, {});
};

export const removeKeys = (obj: DataObject, keys: string[]): DataObject => {
  if (obj == null || typeof obj !== "object") {
    return obj;
  }

  const result = { ...obj };

  for (const key of keys) {
    if (key.includes(".")) {
      deleteNestedPath(result, key);
    } else {
      delete result[key];
    }
  }

  return result;
};

// ============================================================================
// CONDITIONAL EVALUATION
// ============================================================================

export const evaluateCondition = (
  fieldValue: unknown,
  operator: ComparisonOperator,
  value: unknown
): boolean => {
  switch (operator) {
    case ComparisonOperator.EQUALS:
      return fieldValue == value;

    case ComparisonOperator.STRICT_EQUALS:
      return fieldValue === value;

    case ComparisonOperator.NOT_EQUALS:
      return fieldValue != value;

    case ComparisonOperator.GREATER_THAN:
      return (fieldValue as number) > (value as number);

    case ComparisonOperator.LESS_THAN:
      return (fieldValue as number) < (value as number);

    case ComparisonOperator.GREATER_THAN_OR_EQUAL:
      return (fieldValue as number) >= (value as number);

    case ComparisonOperator.LESS_THAN_OR_EQUAL:
      return (fieldValue as number) <= (value as number);

    case ComparisonOperator.CONTAINS:
      if (fieldValue == null) return false;
      if (Array.isArray(fieldValue)) return fieldValue.includes(value);
      return String(fieldValue).includes(String(value));

    case ComparisonOperator.STARTS_WITH:
      return fieldValue != null && String(fieldValue).startsWith(String(value));

    case ComparisonOperator.ENDS_WITH:
      return fieldValue != null && String(fieldValue).endsWith(String(value));

    case ComparisonOperator.IN:
      return Array.isArray(value) && (value as unknown[]).includes(fieldValue);

    case ComparisonOperator.NOT_IN:
      return Array.isArray(value) && !(value as unknown[]).includes(fieldValue);

    case ComparisonOperator.EXISTS:
      return fieldValue !== null && fieldValue !== undefined;

    case ComparisonOperator.NOT_EXISTS:
      return fieldValue === null || fieldValue === undefined;

    default:
      return true;
  }
};

// ============================================================================
// ARRAY OPERATIONS (using lodash)
// ============================================================================

export const aggregate = <T extends DataObject>(
  data: T[],
  operation: AggregationOperation | string,
  field?: string
): unknown => {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const values = field
    ? data.map((item) => getNestedValue(item, field)).filter((v) => v != null)
    : data;

  switch (operation) {
    case AggregationOperation.SUM:
      return _.sumBy(values, (v) => Number(v));

    case AggregationOperation.AVG:
    case AggregationOperation.AVERAGE:
      return _.meanBy(values, (v) => Number(v));

    case AggregationOperation.COUNT:
      return values.length;

    case AggregationOperation.MIN:
      return _.minBy(values, (v) => Number(v));

    case AggregationOperation.MAX:
      return _.maxBy(values, (v) => Number(v));

    case AggregationOperation.FIRST:
      return _.first(values);

    case AggregationOperation.LAST:
      return _.last(values);

    case AggregationOperation.UNIQUE:
      return _.uniq(values);

    case AggregationOperation.JOIN:
      return values.map((v) => String(v)).join(", ");

    default:
      return values;
  }
};

// ============================================================================
// TYPE CONVERSION
// ============================================================================

export const convertTypes = (
  obj: DataObject,
  conversions: Record<string, ConversionType>
): DataObject => {
  if (obj == null || typeof obj !== "object") {
    return obj;
  }

  const result = { ...obj };

  for (const [field, targetType] of Object.entries(conversions)) {
    const value = getNestedValue(result, field);
    if (value == null) continue;

    const converted = convertValue(value, targetType);

    if (field.includes(".")) {
      setNestedValue(result, field, converted);
    } else {
      result[field] = converted;
    }
  }

  return result;
};

export const convertValue = (value: unknown, targetType: ConversionType): unknown => {
  switch (targetType) {
    case ConversionType.STRING:
      return String(value);

    case ConversionType.NUMBER:
      return Number(value);

    case ConversionType.INTEGER:
      return Math.floor(Number(value));

    case ConversionType.BOOLEAN:
      if (typeof value === ConversionType.BOOLEAN) return value;
      if (typeof value === ConversionType.STRING) {
        return String(value).toLowerCase() === "true" || value === "1";
      }
      return Boolean(value);

    case ConversionType.DATE:
      return new Date(value as string | number | Date);

    case ConversionType.ARRAY:
      return Array.isArray(value) ? value : [value];

    case ConversionType.OBJECT:
      return typeof value === ConversionType.OBJECT && value !== null ? value : { value };

    default:
      return value;
  }
};

// ============================================================================
// DATE OPERATIONS (using date-fns)
// ============================================================================

export const performDateOperation = (
  obj: DataObject,
  field: string | undefined,
  operation: DateOperation | string,
  value: number,
  unit: TimeUnit | string,
  target?: string
): DataObject | string => {
  const dateValue = field ? getNestedValue(obj, field) : obj;
  let date: Date;

  if (typeof dateValue === "string") {
    date = parseISO(dateValue);
  } else {
    date = new Date(dateValue as string | number | Date);
  }

  if (!isValid(date)) {
    return obj;
  }

  const duration: any = { [unit]: value };
  const newDate =
    operation === DateOperation.ADD || operation === "add"
      ? add(date, duration)
      : sub(date, duration);

  const resultValue = newDate.toISOString();

  if (!field && !target) {
    return resultValue;
  }

  const result = { ...obj };
  const targetField = target || field;

  if (targetField) {
    if (targetField.includes(".")) {
      setNestedValue(result, targetField, resultValue);
    } else {
      result[targetField] = resultValue;
    }
  }

  return result;
};

export const formatDateField = (
  obj: DataObject,
  field: string | undefined,
  formatStr: FormatType | string,
  target?: string,
  timezone?: string
): DataObject | string => {
  const value = field ? getNestedValue(obj, field) : obj;
  let date: Date;

  if (typeof value === "string") {
    date = parseISO(value);
  } else {
    date = new Date(value as string | number | Date);
  }

  if (!isValid(date)) {
    return obj;
  }

  let formatted: string;

  switch (formatStr.toUpperCase()) {
    case FormatType.ISO:
      formatted = date.toISOString();
      break;

    case FormatType.DATE:
      formatted = format(date, "yyyy-MM-dd");
      break;

    case FormatType.TIME:
      formatted = format(date, "HH:mm:ss");
      break;

    case FormatType.DATETIME:
      formatted = format(date, "yyyy-MM-dd HH:mm:ss");
      break;

    case FormatType.TIMESTAMP:
      formatted = String(date.getTime());
      break;

    default:
      // Custom format string
      formatted = format(date, formatStr);
  }

  if (!field && !target) {
    return formatted;
  }

  const result = { ...obj };
  const targetField = target || field;

  if (targetField) {
    if (targetField.includes(".")) {
      setNestedValue(result, targetField, formatted);
    } else {
      result[targetField] = formatted;
    }
  }

  return result;
};

export const handleTimestamp = (
  obj: DataObject,
  field: string | undefined,
  operation: TimestampOperation,
  unit: TimeUnit,
  target?: string
): DataObject | number | string => {
  const value = field ? getNestedValue(obj, field) : obj;

  let result: number | string;

  if (operation === TimestampOperation.TO_TIMESTAMP) {
    const date = new Date(value as string | number | Date);
    result = unit === TimeUnit.SECONDS ? Math.floor(date.getTime() / 1000) : date.getTime();
  } else {
    const timestamp = Number(value);
    const ms = unit === TimeUnit.SECONDS ? timestamp * 1000 : timestamp;
    result = new Date(ms).toISOString();
  }

  if (!field && !target) {
    return result;
  }

  const output = { ...obj };
  const targetField = target || field;

  if (targetField) {
    if (targetField.includes(".")) {
      setNestedValue(output, targetField, result);
    } else {
      output[targetField] = result;
    }
  }

  return output;
};

// ============================================================================
// DEEP MERGE (using lodash)
// ============================================================================

export const deepMerge = (...objects: DataObject[]): DataObject => {
  return _.merge({}, ...objects);
};

export const deepClone = <T>(obj: T): T => {
  return _.cloneDeep(obj);
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const handleDataTransformNode = async (
  node: Node,
  nodeLogId: string,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<{ status: ExecutionStatus; nextNodeId: string | null; error?: Error }> => {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let error: Error | undefined;
  let result: any = null;

  const dataTransformNode = await getDataTransformNodeById(node.id);
  const taskLog = await logTaskExecution({
    node_log_id: nodeLogId,
    task_id: dataTransformNode.id,
    task_type: node.type,
    status: TaskStatus.RUNNING,
  });

  try {
    if (!dataTransformNode.transform_rules) {
      throw new Error("Transform rules do not exist");
    }

    const inputData = prevNodeId
      ? context?.output?.[prevNodeId]?.result
      : context.input || context.data || {};

    const transformRules = resolveTemplate(dataTransformNode.transform_rules, context);
    const typeKey = dataTransformNode.transformation_type as keyof TransformationRuleMap;
    const handler = transformationHandlers[typeKey];

    if (!handler) {
      throw new Error(`Unsupported transformation type: ${dataTransformNode.transformation_type}`);
    }

    result = await handler(inputData, transformRules, context);

    context.output ??= {};
    context.output[node.id] = {
      result,
      timestamp: new Date().toISOString(),
      transformationType: dataTransformNode.transformation_type,
    };

    await updateTaskLog(taskLog.id, {
      status: TaskStatus.COMPLETED,
      data: result,
      created_at: new Date(),
    });
  } catch (err) {
    nodeStatus = ExecutionStatus.FAILED;
    error = err instanceof Error ? err : new Error(String(err));

    await updateTaskLog(taskLog.id, {
      status: TaskStatus.FAILED,
      data: { error: String(error) },
      created_at: new Date(),
    });
  }

  const nextNodeId = await getNextNodeId(node.id, NodeEdgesCondition.NONE, groupId);
  return { status: nodeStatus, nextNodeId, error };
};
