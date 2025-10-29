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
  AggregateResponse,
  FormulaResponse,
  ConcatNodeConfig,
  RuleExecutorResponse,
} from "../types";
import {
  evaluateCondition,
  executeCodeBlock,
  httpRequest,
  mergeConditions,
  resoleTemplateAndNormalize,
  sendEmail,
} from "../utils";
import {
  aggregate,
  convertValue,
  formatDateField,
  getNestedValue,
  handleConditionalNode,
  handleLoopNode,
  handleSwitchNode,
  handleTimestamp,
  performDateOperation,
  removeKeys,
  renameKeys,
  setNestedValue,
} from "./node-task";
import _ from "lodash";
import { getRuleExecutionData } from "./static-data";

// Generic input type with properly constrained node.config
export type NodeExecutorInput<T extends NodeType> = {
  node: ExtendedNode<T>;
  context: DataObject;
  executionContext: DataObject;
  groupId: string | null;
  executionId: string;
};

// Generic executor function type
export type NodeExecutorFn<T extends NodeType> = (input: NodeExecutorInput<T>) => Promise<NodeResponse<T>>;

export const taskExecutors: { [K in NodeType]: NodeExecutorFn<K> } = {
  // =============================
  // Action Nodes
  // =============================
  [NodeType.SEND_EMAIL]: async ({ node, context }): Promise<SendEmailResponse> => {
    const { from, to, subject, message } = node.config;
    const resolvedBody: EmailOptions = resoleTemplateAndNormalize({ from, to, subject, message }, context);

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
    const resolvedBody = resoleTemplateAndNormalize(body, context);
    const res = await httpRequest(method, url, resolvedBody, headers);

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
  [NodeType.CONDITIONAL]: async ({ context, node }): Promise<ConditionalResponse> => {
    return await handleConditionalNode(node, context);
  },

  [NodeType.LOOP]: async ({ context, executionContext, node, executionId }): Promise<LoopResponse> => {
    return await handleLoopNode(node, executionId, context, executionContext);
  },

  [NodeType.SWITCH]: async ({ node, context }): Promise<SwitchResponse> => {
    return await handleSwitchNode(node, context);
  },

  [NodeType.RULE_EXECUTOR]: async ({ node, context }): Promise<RuleExecutorResponse> => {
    const { ruleset_id } = node.config;
    const { url, method, headers, body } = await getRuleExecutionData(ruleset_id);
    const res = await httpRequest(method, url, body, headers);
    const ruleEvaluationResult = res.evaluationSummary.passed;
    return { ruleEvaluationResult };
  },

  // =============================
  // Data Transform Nodes
  // =============================
  [NodeType.MAP]: async ({ node, context }): Promise<MapResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context, true);
    const { mapping } = config;
    const input = { ...(context["input"] ?? {}) };

    const output: any = {};

    if (Array.isArray(mapping)) {
      for (const rule of mapping) {
        setNestedValue(output, rule.target, rule.source);
      }
    }

    return { mapped_data: { ...input, ...output } };
  },

  [NodeType.RENAME]: async ({ node, context }): Promise<RenameResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context);
    const input = { ...(context["input"] ?? {}) };

    if (Array.isArray(config)) {
      const result = config.map((item) => {
        const mapping = item?.from && item?.to ? { [item.from]: item.to } : {};
        return renameKeys(input, mapping);
      });
      return {
        renamed_data: result,
        original_data: input,
      };
    }

    const { from, to } = config;
    const mapping = from && to ? { [from]: to } : {};
    const result = renameKeys(input, mapping);

    return {
      renamed_data: result,
      original_data: input,
    };
  },

  [NodeType.REMOVE]: async ({ node, context }): Promise<RemoveResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context);
    const { fields } = config;
    const input = { ...(context["input"] ?? {}) };

    const removed: JsonObject = {};
    for (const key of fields) {
      const val = getNestedValue(input, key);
      if (val !== undefined) {
        removed[key] = val;
      }
    }

    const result = removeKeys(input, fields);

    return {
      removed_data: removed,
      remaining_data: result,
      original_data: input,
    };
  },

  [NodeType.FILTER]: async ({ node, context }): Promise<FilterResponse> => {
    const resolvedData = resoleTemplateAndNormalize(node.config.data, context);
    const { condition } = node.config;

    if (!Array.isArray(resolvedData)) {
      throw new Error("FILTER node expects `data` to be an array");
    }

    const combinedExpression = mergeConditions(condition);

    const filtered_data: JsonValue[] = [];
    const excluded_data: JsonValue[] = [];

    for (const item of resolvedData) {
      try {
        const result = evaluateCondition(combinedExpression, { input: item });

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
      original_data: resolvedData,
    };
  },

  [NodeType.CONVERT_TYPE]: async ({ node, context }): Promise<ConvertTypeResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context);
    const input = { ...(context["input"] ?? {}) };

    if (Array.isArray(config)) {
      const result = config.map((item) => {
        return convertValue(item.field, item.toType);
      });
      return {
        converted_value: result,
        original_data: input,
      };
    }

    const { field, toType } = config;
    const result = convertValue(field, toType);
    return {
      converted_value: result,
      original_data: input,
    };
  },

  [NodeType.SPLIT]: async ({ node, context }): Promise<SplitResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context);
    const input = { ...(context["input"] ?? {}) };

    const { field, separator = ",", target, limit, trim = true } = config;
    let result: string[];

    if (typeof field === "string") {
      const parts = limit ? field.split(separator, limit) : field.split(separator);
      result = trim ? parts.map((p) => p.trim()) : parts;
    } else if (Array.isArray(field)) {
      result = limit ? field.slice(0, limit).map(String) : field.map(String);
    } else {
      result = Array.isArray(field) ? (field as string[]) : [String(field ?? "")];
    }

    if (target) {
      const output = Array.isArray(config)
        ? [...(input as JsonValue[])]
        : typeof config === "object" && config !== null
        ? { ...(input as Record<string, unknown>) }
        : {};

      setNestedValue(output as Record<string, unknown>, target, result);
      return {
        split_data: output as JsonValue[],
        original_data: input as string,
      };
    }

    return {
      split_data: result,
      original_data: input as string,
    };
  },

  [NodeType.DATE_FORMAT]: async ({ node, context }): Promise<DateFormatResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context);
    const { field, format: formatStr = FormatType.ISO, target, timezone } = config;
    const input = { ...(context["input"] ?? {}) };

    const result = formatDateField(input, field, formatStr, target, timezone);
    return {
      formatted_date: (target ? (result as DataObject)[target] : result) as string,
      original_data: input,
    };
  },

  [NodeType.DATE_OPERATION]: async ({ node, context }): Promise<DateOperationResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context);

    const input = { ...(context["input"] ?? {}) };

    if (Array.isArray(config)) {
      const result = config.map((item) => {
        const { field, operation, value, unit = TimeUnit.DAYS, target } = item;
        return performDateOperation(input, field, operation, value, unit, target);
      });
      return {
        date_result: result,
        original_data: input,
      };
    }

    const { field, operation, value, unit = TimeUnit.DAYS, target } = config;
    const result = performDateOperation(input, field, operation, value, unit, target);
    return {
      date_result: result,
      original_data: input,
    };
  },

  [NodeType.TIMESTAMP]: async ({ node, context }): Promise<TimestampResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context);
    const input = { ...(context["input"] ?? {}) };

    if (Array.isArray(config)) {
      const result = config.map((item) => {
        const { field, target, operation = TimestampOperation.TO_TIMESTAMP, unit = TimeUnit.MILLISECONDS } = item;
        return handleTimestamp(input, field, operation, unit, target);
      });
      return {
        original_data: input,
        timestamp_result: result,
      };
    }

    const { field, target, operation = TimestampOperation.TO_TIMESTAMP, unit = TimeUnit.MILLISECONDS } = config;
    const result = handleTimestamp(input, field, operation, unit, target);
    return {
      original_data: input,
      timestamp_result: result,
    };
  },

  [NodeType.MERGE]: async () => {
    throw new Error("Merge node executor not implemented");
  },

  [NodeType.COPY]: async ({ node, context }): Promise<CopyResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context);
    const input = { ...(context["input"] ?? {}) };

    if (Array.isArray(config)) {
      const result = config.map((item) => {
        const result = { ...(input as JsonObject) };
        setNestedValue(result, item.to, item.from);
        return result;
      });
      return {
        copied_data: result,
        original_data: input,
      };
    }

    const { from, to } = config;
    if (!from || !to) {
      throw new Error("Copy requires 'from' and 'to' fields");
    }

    const result = { ...(input as JsonObject) };
    setNestedValue(result, to, from);
    return {
      copied_data: result,
      original_data: input,
    };
  },

  [NodeType.AGGREGATE]: async ({ node, context }): Promise<AggregateResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context, true);
    const { data = [], groupBy = [], operations = [] } = config;

    if (!Array.isArray(data)) {
      throw new Error("Aggregate requires array data");
    }

    if (groupBy.length > 0) {
      const grouped = _.groupBy(data, (item) => groupBy.map((key: string) => getNestedValue(item, key)).join("|"));

      const aggData = Object.entries(grouped).map(([key, items]) => {
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
      return {
        aggregated_data: aggData,
        original_data: data,
      };
    }

    const result: any = {};
    operations.forEach((op: any) => {
      const aggResult = aggregate(data as JsonObject[], op.type, op.field);
      result[op.target || op.field] = aggResult;
    });

    return {
      aggregated_data: result,
      original_data: data,
    };
  },

  [NodeType.GROUP]: async ({ node, context }): Promise<GroupResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context, true);
    const { data = [], groupBy = [] } = config;

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

  [NodeType.CONCAT]: async ({ node, context }): Promise<ConcatResponse> => {
    const config = resoleTemplateAndNormalize(node.config, context);
    const input = { ...(context["input"] ?? {}) };

    const concatenate = (item: ConcatNodeConfig): JsonObject => {
      const { sources = [], target, separator = "," } = item;
      const values = sources.map((source: string) => {
        return source != null ? String(source) : "";
      });

      const concatenated = values.join(separator);
      const result = { ...(input as JsonObject) };
      setNestedValue(result, target, concatenated);
      return result;
    };

    if (Array.isArray(config)) {
      const response = config.map(concatenate);
      return {
        concatenated_data: response,
        original_data: input as JsonObject[],
      };
    }

    const response = [concatenate(config)];
    return {
      concatenated_data: response,
      original_data: [input as JsonObject],
    };
  },

  [NodeType.CODE_BLOCK]: async ({ node, context }): Promise<CodeBlockResponse> => {
    const data = resoleTemplateAndNormalize(node.config, context);
    const { expression, language } = node.config;

    if (!expression) {
      throw new Error("No code or expression provided");
    }

    const execContext = {
      ...context,
      data,
      _,
    };
    const resolvedCode = resoleTemplateAndNormalize(expression, execContext, true);
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
  }): Promise<FormulaResponse> => {
    const resolvedExpression = resoleTemplateAndNormalize(expression, context, true);

    const result = new Function(`return (${resolvedExpression});`)();
    return {
      formula_result: result,
      original_data: expression,
    };
  },
};
