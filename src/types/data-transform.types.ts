import {
  AggregationOperation,
  CodeBlockLanguage,
  ConversionType,
  DateOperation,
  MergeStrategy,
  NodeType,
  TimestampOperation,
  TimeUnit,
} from "./enums";

export interface MapRule {
  source: string; // JSON path in input, e.g., "$.input.first_name"
  target: string; // JSON path in output, e.g., "$.output.firstName"
}

export interface RenameRule {
  from: string;
  to: string;
}

export interface RemoveRule {
  fields: string[];
}

export interface CopyRule extends RenameRule {}

export interface FilterRule {
  condition: string; // e.g., "{{ $.input.amount > 1000 }}"
}

export interface AggregateRule {
  groupBy: string[];
  operations: {
    field: string; // field to aggregate
    type: AggregationOperation; // aggregation type
    target: string; // path in output
  }[];
}

export interface GroupRule {
  groupBy: string[];
}

export interface ConcatRule {
  sources: string[];
  target: string;
  separator?: string;
}

export interface CustomRule {
  expression: string; // JS expression to transform input
}

export interface ConvertTypeRule {
  field: string;
  toType: ConversionType;
}

export interface MergeRule {
  source: string;
  target: string;
  strategy?: MergeStrategy;
}

export interface SplitRule {
  field: string;
  separator: string;
  target: string;
  limit?: number;
  trim?: boolean;
}

export interface DateFormatRule {
  field: string;
  format: string; // e.g., "YYYY-MM-DD"
  target?: string;
  timezone?: string;
}

export interface DateOperationRule {
  field: string;
  operation: DateOperation;
  value: number;
  unit: TimeUnit;
  target?: string;
}

export interface TimestampRule {
  field?: string; // optional, can generate current timestamp
  target: string;
  unit?: TimeUnit;
  operation?: TimestampOperation;
}

export interface FormulaRule {
  expression: string;
}

export interface TransformationRuleMap {
  [NodeType.MAP]: { map: MapRule[] };
  [NodeType.RENAME]: RenameRule;
  [NodeType.REMOVE]: RemoveRule;
  [NodeType.FILTER]: FilterRule;
  [NodeType.FORMULA]: FormulaRule;
  [NodeType.CONVERT_TYPE]: ConvertTypeRule;
  [NodeType.MERGE]: MergeRule;
  [NodeType.SPLIT]: SplitRule;
  [NodeType.DATE_FORMAT]: DateFormatRule;
  [NodeType.DATE_OPERATION]: DateOperationRule;
  [NodeType.TIMESTAMP]: TimestampRule;
  [NodeType.COPY]: CopyRule;
  [NodeType.AGGREGATE]: AggregateRule;
  [NodeType.GROUP]: GroupRule;
  [NodeType.CONCAT]: ConcatRule;
}

export type DataTransformationRuleConfig =
  | { map: MapRule[] }
  | RenameRule
  | RemoveRule
  | FilterRule
  | FormulaRule
  | ConvertTypeRule
  | MergeRule
  | SplitRule
  | DateFormatRule
  | DateOperationRule
  | TimestampRule
  | CopyRule
  | AggregateRule
  | GroupRule
  | ConcatRule;

export type DataObject = Record<string, any>;
