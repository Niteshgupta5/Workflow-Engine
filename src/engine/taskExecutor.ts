import { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import {
  HttpMethod,
  NodeType,
  NodeResponse,
  SendEmailResponse,
  SendHttpRequestResponse,
  UpdateDatabaseResponse,
  MapResponse,
  RenameResponse,
  RemoveResponse,
  FilterResponse,
  DataObject,
  ConvertTypeResponse,
  SplitResponse,
  DateFormatResponse,
  FormatType,
  TimeUnit,
  DateOperationResponse,
  TimestampOperation,
  TimestampResponse,
  CopyResponse,
  GroupResponse,
  ConcatResponse,
  CodeBlockResponse,
  ExtendedNode,
  ConditionalResponse,
  LoopResponse,
  SwitchResponse,
  EmailOptions,
} from "../types";
import { evaluateCondition, executeCodeBlock, httpRequest, resolveTemplate, sendEmail } from "../utils";
import {
  aggregate,
  convertTypes,
  formatDateField,
  getNestedValue,
  handleConditionalNode,
  handleLoopNode,
  handleSwitchNode,
  handleTimestamp,
  mapObject,
  performDateOperation,
  removeKeys,
  renameKeys,
  setNestedValue,
} from "./node-task";
import _ from "lodash";

// Generic input type with properly constrained node.config
export type NodeExecutorInput<T extends NodeType> = {
  node: ExtendedNode<T>;
  context: DataObject;
  executionContext: DataObject;
  groupId: string | null;
};

// Generic executor function type
export type NodeExecutorFn<T extends NodeType> = (input: NodeExecutorInput<T>) => Promise<NodeResponse<T>>;

export const taskExecutors: { [K in NodeType]: NodeExecutorFn<K> } = {
  // =============================
  // Action Nodes
  // =============================
  [NodeType.SEND_EMAIL]: async ({ node, context }): Promise<SendEmailResponse> => {
    const { from, to, subject, message } = node.config;
    const resolvedBody: EmailOptions = resolveTemplate({ from, to, subject, message }, context);

    const emailResponse = await sendEmail(resolvedBody);
    const response: SendEmailResponse = {
      ...resolvedBody,
      message: emailResponse.message,
      status: "sent",
      timestamp: new Date().toISOString(),
    };
    return response;
  },

  [NodeType.SEND_HTTP_REQUEST]: async ({ node, context }): Promise<SendHttpRequestResponse> => {
    const { url, method = HttpMethod.GET, body = {}, headers = {} } = node.config;
    const resolvedBody = resolveTemplate(body, context);
    const res = await httpRequest(method, url, resolvedBody, headers);
    console.log("=====>res", res);

    const response: SendHttpRequestResponse = {
      method,
      url,
      response_code: res.status,
      status: res.status >= 200 && res.status < 300 ? "success" : "failure",
      response: res,
    };
    return response;
  },

  [NodeType.UPDATE_DATABASE]: async ({ node }): Promise<UpdateDatabaseResponse> => {
    const { table, data } = node.config;
    const response: UpdateDatabaseResponse = {
      table,
      data,
      status: "success",
      updated_count: Object.keys(data).length,
    };
    return response;
  },

  // =============================
  // Flow Control Nodes
  // =============================
  [NodeType.CONDITIONAL]: async ({ context, node, groupId }): Promise<ConditionalResponse> => {
    return await handleConditionalNode(node, context, groupId);
  },

  [NodeType.LOOP]: async ({ context, executionContext, node }): Promise<LoopResponse> => {
    return await handleLoopNode(node, "", context, executionContext);
  },

  [NodeType.SWITCH]: async ({ node, context }): Promise<SwitchResponse> => {
    return handleSwitchNode(node, context);
  },

  // =============================
  // Data Transform Nodes
  // =============================
  [NodeType.MAP]: async ({ node, context }): Promise<MapResponse> => {
    const data = resolveTemplate(node.config, context);
    const { map } = node.config;

    if (Array.isArray(data)) {
      const result = data.map((item) => mapObject(item, map));
      return {
        mapped_data: result[0],
      };
    }

    const result = mapObject(data, map);
    return {
      mapped_data: result,
    };
  },

  [NodeType.RENAME]: async ({ node, context }): Promise<RenameResponse> => {
    const data = resolveTemplate(node.config, context);
    const { from, to } = node.config;

    const mapping = from && to ? { [from]: to } : {};

    if (Array.isArray(data)) {
      const result = data.map((item) => renameKeys(item, mapping));
      return {
        renamed_data: result,
      };
    }

    const result = renameKeys(data, mapping);
    return {
      original_data: { to, from },
      renamed_data: result,
    };
  },

  [NodeType.REMOVE]: async ({ node, context }): Promise<RemoveResponse> => {
    const data = resolveTemplate(node.config, context);
    const { fields } = node.config;

    if (Array.isArray(data)) {
      const result = data.map((item) => removeKeys(item, fields));

      const removedData = data.map((item) => {
        const removed: JsonObject = {};
        for (const key of fields) {
          const val = getNestedValue(item, key);
          if (val !== undefined) {
            removed[key] = val;
          }
        }
        return removed;
      });

      return {
        original_data: data,
        remaining_data: result,
        removed_data: removedData,
      };
    }

    const removed: JsonObject = {};
    for (const key of fields) {
      const val = getNestedValue(data, key);
      if (val !== undefined) {
        removed[key] = val;
      }
    }

    const result = removeKeys(data, fields);

    return {
      original_data: data,
      remaining_data: result,
      removed_data: removed,
    };
  },

  [NodeType.FILTER]: async ({ node, context }): Promise<FilterResponse> => {
    const data = resolveTemplate(node.config, context);
    const { condition } = node.config;

    if (!Array.isArray(data)) {
      throw new Error("FILTER node expects `data` to be an array");
    }

    if (condition && typeof condition === "string") {
      const filtered_data: JsonValue[] = [];
      const excluded_data: JsonValue[] = [];

      for (const item of data) {
        try {
          const result = evaluateCondition(condition, { ...context, data: item });

          if (result.status) {
            filtered_data.push(item);
          } else {
            excluded_data.push(item);
          }
        } catch (err) {
          excluded_data.push(item);
        }
      }

      return {
        filtered_data,
        excluded_data,
        original_data: data,
      };
    }

    return {
      filtered_data: data,
      excluded_data: [],
      original_data: data,
    };
  },

  [NodeType.CONVERT_TYPE]: async ({ node, context }): Promise<ConvertTypeResponse> => {
    const data = resolveTemplate(node.config, context);
    const { field, toType } = node.config;

    const conversionMap = { [field]: toType };

    if (Array.isArray(data)) {
      const result = data.map((item) => convertTypes(item, conversionMap));
      return {
        converted_value: result,
        original_data: data,
      };
    }

    const result = convertTypes(data, conversionMap);
    return {
      converted_value: result,
      original_data: data,
    };
  },

  [NodeType.SPLIT]: async ({ node, context }): Promise<SplitResponse> => {
    const data = resolveTemplate(node.config, context);
    const { field, separator = ",", target, limit, trim = true } = node.config;

    const sep = separator;
    const value = field ? getNestedValue(data, field) : data;

    let result: string[];

    if (typeof value === "string") {
      const parts = limit ? value.split(sep, limit) : value.split(sep);
      result = trim ? parts.map((p) => p.trim()) : parts;
    } else if (Array.isArray(value)) {
      result = limit ? value.slice(0, limit).map(String) : value.map(String);
    } else {
      result = Array.isArray(value) ? (value as string[]) : [String(value ?? "")];
    }

    if (target) {
      const output = Array.isArray(data)
        ? [...data]
        : typeof data === "object" && data !== null
        ? { ...(data as Record<string, unknown>) }
        : {};

      setNestedValue(output as Record<string, unknown>, target, result);

      return {
        original_data: data as string,
        split_data: output as JsonValue[],
      };
    }

    return {
      original_data: data as string,
      split_data: result,
    };
  },

  [NodeType.DATE_FORMAT]: async ({ node, context }): Promise<DateFormatResponse> => {
    const data = resolveTemplate(node.config, context);
    const { field, format: formatStr = FormatType.ISO, target, timezone } = node.config;

    const result = formatDateField(data, field, formatStr, target, timezone);
    return {
      formatted_date: (target ? (result as DataObject)[target] : result) as string,
      original_data: data,
    };
  },

  [NodeType.DATE_OPERATION]: async ({ node, context }): Promise<DateOperationResponse> => {
    const data = resolveTemplate(node.config, context);
    const { field, operation, value, unit = TimeUnit.DAYS, target } = node.config;

    if (Array.isArray(data)) {
      const result = data.map((item) => performDateOperation(item, field, operation, value, unit, target));
      return {
        date_result: result,
        original_data: data,
      };
    }

    const result = performDateOperation(data, field, operation, value, unit, target);
    return {
      date_result: result,
      original_data: data,
    };
  },

  [NodeType.TIMESTAMP]: async ({ node, context }): Promise<TimestampResponse> => {
    const data = resolveTemplate(node.config, context);
    const { field, target, operation = TimestampOperation.TO_TIMESTAMP, unit = TimeUnit.MILLISECONDS } = node.config;

    if (Array.isArray(data)) {
      const result = data.map((item) => handleTimestamp(item, field, operation, unit, target));
      return {
        original_data: data,
        timestamp_result: result,
      };
    }

    const result = handleTimestamp(data, field, operation, unit, target);
    return {
      original_data: data,
      timestamp_result: result,
    };
  },

  [NodeType.MERGE]: async () => {
    throw new Error("Merge node executor not implemented");
  },

  [NodeType.COPY]: async ({ node, context }): Promise<CopyResponse> => {
    const data = resolveTemplate(node.config, context);
    const { from, to } = node.config;

    if (!from || !to) {
      throw new Error("Copy requires 'from' and 'to' fields");
    }

    if (Array.isArray(data)) {
      const result = data.map((item) => {
        const result = { ...(item as JsonObject) };
        const value = getNestedValue(item, from);
        setNestedValue(result, to, value);
        return result;
      });
      return {
        copied_data: result,
        original_data: data,
      };
    }

    const result = { ...(data as JsonObject) };
    const value = getNestedValue(data, from);
    setNestedValue(result, to, value);
    return {
      copied_data: result,
      original_data: data,
    };
  },

  [NodeType.AGGREGATE]: async ({ node, context }) => {
    const data = resolveTemplate(node.config, context);
    const { groupBy = [], operations = [] } = node.config;

    if (!Array.isArray(data)) {
      throw new Error("Aggregate requires array data");
    }

    if (groupBy.length > 0) {
      const grouped = _.groupBy(data, (item) => groupBy.map((key: string) => getNestedValue(item, key)).join("|"));

      return Object.entries(grouped).map(([key, items]) => {
        const groupKeys = key.split("|");
        const result: any = {};

        groupBy.forEach((field: string, i: number) => {
          result[field] = groupKeys[i];
        });

        operations.forEach((op: any) => {
          const aggResult = aggregate(items as JsonObject[], op.type, op.field);
          result[op.target || op.field] = aggResult;
        });

        return result;
      });
    }

    const result: any = {};
    operations.forEach((op: any) => {
      const aggResult = aggregate(data as JsonObject[], op.type, op.field);
      result[op.target || op.field] = aggResult;
    });

    return result;
  },

  [NodeType.GROUP]: async ({ node, context }): Promise<GroupResponse> => {
    const data = resolveTemplate(node.config, context);
    const { groupBy } = node.config;

    if (!Array.isArray(data)) {
      throw new Error("Group requires array data");
    }

    if (groupBy.length === 0) {
      throw new Error("Group requires at least one groupBy field");
    }

    if (groupBy.length === 1) {
      const response = _.groupBy(data, (item) => getNestedValue(item, groupBy[0]));
      return {
        grouped_data: response,
        original_data: data,
      };
    }

    const response = _.groupBy(data, (item) => groupBy.map((key: string) => getNestedValue(item, key)).join("|"));
    return {
      grouped_data: response,
      original_data: data,
    };
  },

  [NodeType.CONCAT]: async ({ node, context }): Promise<ConcatResponse<JsonObject>> => {
    const data = resolveTemplate(node.config, context);
    const { sources = [], target, separator = "," } = node.config;

    if (!target) {
      throw new Error("Concat requires a 'target' field");
    }

    const concatenate = (item: JsonValue): JsonObject => {
      const values = sources.map((source: string) => {
        const value = getNestedValue(item, source);
        return value != null ? String(value) : "";
      });

      const concatenated = values.join(separator);
      const result = { ...(item as JsonObject) };
      setNestedValue(result, target, concatenated);
      return result;
    };

    if (Array.isArray(data)) {
      const response = data.map(concatenate);
      return {
        concatenated_data: response,
        original_data: data as JsonObject[],
      };
    }

    const response = [concatenate(data)];
    return {
      concatenated_data: response,
      original_data: [data as JsonObject],
    };
  },

  [NodeType.CODE_BLOCK]: async ({ node, context }): Promise<CodeBlockResponse> => {
    const data = resolveTemplate(node.config, context);
    const { expression, language } = node.config;

    if (!expression) {
      throw new Error("No code or expression provided");
    }

    const execContext = {
      ...context,
      data,
      _,
    };
    const resolvedCode = resolveTemplate(expression, execContext, true);
    const result = await executeCodeBlock(resolvedCode, language);

    return {
      code_result: result,
      original_data: data,
    };
  },

  [NodeType.FORMULA]: async ({
    node: {
      config: { expression },
    },
    context,
  }) => {
    const resolvedExpression = resolveTemplate(expression, context, true);

    const result = new Function(`return (${resolvedExpression});`)();
    return result;
  },
};
