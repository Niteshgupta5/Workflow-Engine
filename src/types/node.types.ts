import { Node, NodeEdge } from "@prisma/client";
import { JsonConfig } from "./common.types";
import {
  ActionName,
  LoopType,
  NodeEdgesCondition,
  NodeType,
  SwitchCaseCondition,
  TransformationType,
} from "./enums";
import { DataTransformationRuleConfig } from "./data-transform.types";

export interface CreateNodeRecord {
  workflow_id: string;
  type: NodeType;
  name: string;
  transformation_type?: TransformationType;
  prev_node_id?: string;
  next_node_id?: string;
  group_id?: string;
  condition?: NodeEdgesCondition | SwitchCaseCondition;
  actions?: CreateActionNodeRecord[];
  conditions?: CreateConditionalNodeRecord[];
  configuration?: NodeConfiguration;
}

export interface UpdateNodeRecord {
  type: NodeType;
  name: string;
  transformation_type?: TransformationType;
  actions?: UpdateActionNodeRecord[];
  conditions?: UpdateConditionalNodeRecord[];
  configuration?: NodeConfiguration;
}

export interface CreateNodeEdgeRecord {
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  group_id?: string;
  condition: NodeEdgesCondition | SwitchCaseCondition;
  expression?: string;
}

export interface UpdateNodeEdgeRecord {
  source_node_id?: string;
  target_node_id?: string;
  group_id?: string;
  condition?: NodeEdgesCondition | SwitchCaseCondition;
  expression?: string;
}
export interface GetNodeEdgeWithRelation extends NodeEdge {
  sourceNode?: Node;
  targetNode?: Node;
}

export interface CreateActionNodeRecord {
  node_id: string;
  action_name: ActionName;
  order: number;
  params?: JsonConfig;
  retry_attempts?: number;
  retry_delay_ms?: number;
}

export interface UpdateActionNodeRecord {
  id: string;
  action_name: ActionName;
  params?: JsonConfig;
  retry_attempts?: number;
  retry_delay_ms?: number;
}

export interface CreateConditionalNodeRecord {
  node_id: string;
  order: number;
  expression: string;
}

export interface UpdateConditionalNodeRecord {
  id: string;
  expression: string;
}

export interface ConfigurationRecord extends UpdateConfigurationRecord {
  node_id: string;
}

export interface UpdateConfigurationRecord {
  loop_type?: LoopType;
  max_iterations?: number | null;
  exit_condition?: string;
  data_source_path?: string;
  switch_cases?: JsonConfig;
}

export interface LoopConfiguration {
  loop_type?: LoopType;
  max_iterations?: number | null;
  exit_condition?: string;
  data_source_path?: string;
}

export interface SwitchCaseConfiguration {
  condition: SwitchCaseCondition;
  expression: string;
}

export interface NodeConfiguration {
  loop_configuration: LoopConfiguration;
  switch_cases: SwitchCaseConfiguration[];
  transform_rules: DataTransformationRuleConfig;
}
