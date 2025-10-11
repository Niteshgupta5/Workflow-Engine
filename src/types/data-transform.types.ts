import {
  AggregationOperation,
  CodeBlockLanguage,
  ConversionType,
  DateOperation,
  MergeStrategy,
  TimestampOperation,
  TimeUnit,
  TransformationType,
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

export interface CodeBlockRule {
  language: CodeBlockLanguage;
  expression: string;
}
export interface TransformationRuleMap {
  [TransformationType.MAP]: { map: MapRule[] };
  [TransformationType.RENAME]: RenameRule;
  [TransformationType.REMOVE]: RemoveRule;
  [TransformationType.FILTER]: FilterRule;
  [TransformationType.CODE_BLOCK]: CodeBlockRule;
  [TransformationType.CONVERT_TYPE]: ConvertTypeRule;
  [TransformationType.MERGE]: MergeRule;
  [TransformationType.SPLIT]: SplitRule;
  [TransformationType.DATE_FORMAT]: DateFormatRule;
  [TransformationType.DATE_OPERATION]: DateOperationRule;
  [TransformationType.TIMESTAMP]: TimestampRule;
  [TransformationType.COPY]: CopyRule;
  [TransformationType.AGGREGATE]: AggregateRule;
  [TransformationType.GROUP]: GroupRule;
  [TransformationType.CONCAT]: ConcatRule;
}

export type DataTransformationRuleConfig =
  | { map: MapRule[] }
  | RenameRule
  | RemoveRule
  | FilterRule
  | CodeBlockRule
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

export interface createDataTransformNode {
  node_id: string;
  transformation_type: TransformationType;
  transform_rules: DataTransformationRuleConfig;
}

export type DataObject = Record<string, any>;
