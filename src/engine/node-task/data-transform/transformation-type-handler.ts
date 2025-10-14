import _ from "lodash";
import {
  AggregateRule,
  CodeBlockRule,
  ConcatRule,
  ConvertTypeRule,
  CopyRule,
  DataObject,
  DateFormatRule,
  DateOperationRule,
  FilterRule,
  GroupRule,
  MapRule,
  MergeRule,
  MergeStrategy,
  RemoveRule,
  RenameRule,
  SplitRule,
  TimestampOperation,
  TimestampRule,
  TimeUnit,
  TransformationRuleMap,
  NodeType,
} from "../../../types";
import { evaluateCondition, executeCodeBlock, resolveTemplate } from "../../../utils";
import {
  aggregate,
  convertTypes,
  formatDateField,
  getNestedValue,
  handleTimestamp,
  mapObject,
  performDateOperation,
  removeKeys,
  renameKeys,
  setNestedValue,
} from "./type-helper";

export type TransformationHandler<T extends keyof TransformationRuleMap> = (
  data: any,
  rules: TransformationRuleMap[T],
  context: Record<string, any>
) => Promise<string | number | DataObject>;

export const transformationHandlers: {
  [K in keyof TransformationRuleMap]: TransformationHandler<K>;
} = {
  [NodeType.MAP]: async (data, rules: { map: MapRule[] }, context) => {
    const { map } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => mapObject(item, map));
    }

    return mapObject(data, map);
  },

  [NodeType.RENAME]: async (data, rules: RenameRule, context) => {
    const { from, to } = rules;

    const mapping = from && to ? { [from]: to } : {};

    if (Array.isArray(data)) {
      return data.map((item) => renameKeys(item, mapping));
    }

    return renameKeys(data, mapping);
  },

  [NodeType.REMOVE]: async (data, rules: RemoveRule, context) => {
    const { fields = [] } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => removeKeys(item, fields));
    }

    return removeKeys(data, fields);
  },

  [NodeType.FILTER]: async (data, rules: FilterRule, context) => {
    const { condition } = rules;

    // Support both conditions array and single condition string
    if (condition && typeof condition === "string") {
      // const expression = resolveTemplate(condition, { ...context, data });
      const result = evaluateCondition(condition, { ...context, data });
      return result.status ? data : null;
    }
  },

  [NodeType.CODE_BLOCK]: async (data, rules: CodeBlockRule, context) => {
    const { expression, language } = rules;
    const codeToExecute = expression;

    if (!codeToExecute) {
      throw new Error("No code or expression provided");
    }

    const execContext = {
      ...context,
      data,
      // input: data, // Here data is prev output
      _,
    };
    const resolvedCode = resolveTemplate(codeToExecute, execContext, true);
    const result = await executeCodeBlock(resolvedCode, language);

    return result;
  },

  [NodeType.CONVERT_TYPE]: async (data, rules: ConvertTypeRule, context) => {
    const { field, toType } = rules;

    const conversionMap = { [field]: toType };

    if (Array.isArray(data)) {
      return data.map((item) => convertTypes(item, conversionMap));
    }
    return convertTypes(data, conversionMap);
  },

  [NodeType.MERGE]: async (data, rules: MergeRule, context) => {
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

  [NodeType.SPLIT]: async (data, rules: SplitRule, context) => {
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

  [NodeType.DATE_FORMAT]: async (data, rules: DateFormatRule, context) => {
    const { field, format: formatStr = "ISO", target, timezone } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => formatDateField(item, field, formatStr, target, timezone));
    }

    return formatDateField(data, field, formatStr, target, timezone);
  },

  [NodeType.DATE_OPERATION]: async (data, rules: DateOperationRule, context) => {
    const { field, operation, value, unit = TimeUnit.DAYS, target } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => performDateOperation(item, field, operation, value, unit, target));
    }

    return performDateOperation(data, field, operation, value, unit, target);
  },

  [NodeType.TIMESTAMP]: async (data, rules: TimestampRule, context) => {
    const { field, target, operation = TimestampOperation.TO_TIMESTAMP, unit = TimeUnit.MILLISECONDS } = rules;

    if (Array.isArray(data)) {
      return data.map((item) => handleTimestamp(item, field, operation, unit, target));
    }

    return handleTimestamp(data, field, operation, unit, target);
  },

  [NodeType.COPY]: async (data, rules: CopyRule, context) => {
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

  [NodeType.AGGREGATE]: async (data, rules: AggregateRule, context) => {
    const { groupBy = [], operations = [] } = rules;

    if (!Array.isArray(data)) {
      throw new Error("Aggregate requires array data");
    }

    // Support multiple operations with grouping
    if (groupBy.length > 0) {
      const grouped = _.groupBy(data, (item) => groupBy.map((key: string) => getNestedValue(item, key)).join("|"));

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

  [NodeType.GROUP]: async (data, rules: GroupRule, context) => {
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

    return _.groupBy(data, (item) => groupBy.map((key: string) => getNestedValue(item, key)).join("|"));
  },

  [NodeType.CONCAT]: async (data, rules: ConcatRule, context) => {
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
