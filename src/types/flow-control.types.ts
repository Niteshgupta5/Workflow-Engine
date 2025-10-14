import { ComparisonOperator, LoopType, SwitchCaseCondition } from "./enums";

export interface ConditionalConfig {
  expression: string;
  operator?: ComparisonOperator;
}

export interface LoopConfig {
  loop_type: LoopType;
  max_iterations?: number;
  exit_condition?: string;
  data_source_path?: string;
}

export interface SwitchConfig {
  condition: SwitchCaseCondition;
  expression: string;
}
