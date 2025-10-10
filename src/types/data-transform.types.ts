export type AggregationType = "sum" | "avg" | "count" | "min" | "max";
export type ConversionType = "string" | "number" | "boolean" | "date";
export type DateUnits = "days" | "months" | "years" | "hours" | "minutes";

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
    type: AggregationType; // aggregation type
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
  sources: string[];
  target: string;
}

export interface SplitRule {
  field: string;
  separator: string;
  target: string;
}

export interface DateFormatRule {
  field: string;
  format: string; // e.g., "YYYY-MM-DD"
  target?: string;
}

export interface DateOperationRule {
  field: string;
  operation: "add" | "subtract";
  value: number;
  unit: DateUnits;
  target?: string;
}

export interface TimestampRule {
  field?: string; // optional, can generate current timestamp
  target: string;
}

export type DataTransformationRuleConfig =
  | MapRule[]
  | RenameRule
  | RemoveRule
  | CopyRule
  | FilterRule
  | AggregateRule
  | GroupRule
  | ConcatRule
  | CustomRule
  | CustomRule
  | ConvertTypeRule
  | MergeRule
  | SplitRule
  | DateFormatRule
  | DateOperationRule
  | TimestampRule;
