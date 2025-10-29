import {
  AggregationOperation,
  CodeBlockLanguage,
  ConversionType,
  DateFormat,
  DateOperation,
  LogicalOperator,
  LoopType,
  MergeStrategy,
  NodeType,
  TimestampOperation,
  TimeUnit,
} from "./enums";

import { HttpMethod } from "./enums";

// =============================
// Action Node Configs
// =============================

export type SendEmailConfig = {
  from: string;
  to: string[];
  subject: string;
  message: string;
};

export type SendHttpRequestConfig = {
  method: HttpMethod;
  url: string;
  body?: Record<string, any>;
  headers?: Record<string, any>;
};

export type UpdateDatabaseConfig = {
  table: string;
  data: Record<string, any>;
};

// =============================
// Flow Control Node Configs
// =============================

export type ConditionalConfig = ExpressionConfig;

export type LoopConfig = {
  loop_type: LoopType;
  max_iterations?: number;
  exit_condition?: string;
  data_source_path?: string;
};

export type SwitchConfig = {
  condition: string;
  expression: string;
};

export type RuleExecutorConfig = {
  ruleset_id: string;
};

// =============================
// Transform Node Configs
// =============================

export type ExpressionConfig = {
  expression: string;
  operator?: LogicalOperator;
};

export type MapRule = {
  source: string; // JSON path in input, e.g., "$.input.first_name"
  target: string; // JSON path in output, e.g., "$.output.firstName"
};

export type MappingNodeConfig = {
  mapping: MapRule[];
};

export type RenameNodeConfig = {
  from: string;
  to: string;
};

export type RemoveNodeConfig = {
  fields: string[];
};

export type CopyNodeConfig = RenameNodeConfig;

export type FilterNodeConfig = {
  condition: ExpressionConfig[]; // e.g., "{{ $.input.amount > 1000 }}"
  data: string;
};

export type AggregateNodeConfig = {
  data: string;
  groupBy: string[];
  operations: {
    field: string; // field to aggregate
    type: AggregationOperation; // aggregation type
    target: string; // path in output
  }[];
};

export type GroupNodeConfig = {
  data: string;
  groupBy: string[];
};

export type ConcatNodeConfig = {
  sources: string[];
  target: string;
  separator?: string;
};

export type CustomNodeConfig = {
  expression: string; // JS expression to transform input
};

export type ConvertTypeNodeConfig = {
  field: string;
  toType: ConversionType;
};

export type MergeNodeConfig = {
  source: string;
  target: string;
  strategy?: MergeStrategy;
};

export type SplitNodeConfig = {
  field: string;
  separator: string;
  target: string;
  limit?: number;
  trim?: boolean;
};

export type DateFormatNodeConfig = {
  field: string;
  format: DateFormat;
  target?: string;
  timezone?: string;
};

export type DateOperationNodeConfig = {
  field: string;
  operation: DateOperation;
  value: number;
  unit: TimeUnit;
  target?: string;
};

export type TimestampNodeConfig = {
  field: string; // optional, can generate current timestamp
  target: string;
  unit?: TimeUnit;
  operation?: TimestampOperation;
};

// =============================
// Utility Node Configs
// =============================

export type CodeBlockNodeConfig = {
  language: CodeBlockLanguage;
  expression: string;
};

export type FormulaNodeConfig = {
  expression: string;
};

// =============================
// Node Config Map
// =============================
export type NodeConfigMap = {
  // Action Nodes
  [NodeType.SEND_EMAIL]: SendEmailConfig;
  [NodeType.SEND_HTTP_REQUEST]: SendHttpRequestConfig;
  [NodeType.UPDATE_DATABASE]: UpdateDatabaseConfig;

  // Flow Control Nodes
  [NodeType.LOOP]: LoopConfig;
  [NodeType.CONDITIONAL]: { conditions: ConditionalConfig[] };
  [NodeType.SWITCH]: { switch_cases: SwitchConfig[] };
  [NodeType.RULE_EXECUTOR]: RuleExecutorConfig;

  // Data Transformation Nodes
  [NodeType.MAP]: MappingNodeConfig;
  [NodeType.RENAME]: RenameNodeConfig;
  [NodeType.REMOVE]: RemoveNodeConfig;
  [NodeType.FILTER]: FilterNodeConfig;
  [NodeType.CONVERT_TYPE]: ConvertTypeNodeConfig;
  [NodeType.MERGE]: MergeNodeConfig;
  [NodeType.SPLIT]: SplitNodeConfig;
  [NodeType.DATE_FORMAT]: DateFormatNodeConfig;
  [NodeType.DATE_OPERATION]: DateOperationNodeConfig;
  [NodeType.TIMESTAMP]: TimestampNodeConfig;
  [NodeType.COPY]: CopyNodeConfig;
  [NodeType.AGGREGATE]: AggregateNodeConfig;
  [NodeType.GROUP]: GroupNodeConfig;
  [NodeType.CONCAT]: ConcatNodeConfig;
  [NodeType.FORMULA]: FormulaNodeConfig;

  // Utility Nodes
  [NodeType.CODE_BLOCK]: CodeBlockNodeConfig;
};

// =============================
// Helper Type
// =============================
export type NodeConfig<T extends keyof NodeConfigMap> = NodeConfigMap[T];
