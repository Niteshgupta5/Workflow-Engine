import { Node, NodeEdge } from "@prisma/client";
import { JsonConfig } from "./common.types";
import { ActionName, LoopType, NodeEdgesCondition, NodeType } from "./enums";

export interface CreateNodeRecord {
  workflow_id: string;
  type: NodeType;
  name: string;
  prev_node_id?: string;
  next_node_id?: string;
  group_id?: string;
  condition?: NodeEdgesCondition;
  actions?: CreateActionNodeRecord[];
  conditions?: CreateConditionalNodeRecord[];
  loop_configuration?: LoopConfigurationRecord;
}

export interface UpdateNodeRecord {
  type: NodeType;
  name: string;
  actions?: UpdateActionNodeRecord[];
  conditions?: UpdateConditionalNodeRecord[];
  loop_configuration?: UpdateLoopConfigurationRecord;
}

export interface CreateNodeEdgeRecord {
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  group_id?: string;
  condition: NodeEdgesCondition;
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

export interface LoopConfigurationRecord {
  node_id: string;
  loop_type: LoopType;
  max_iterations?: number | null;
  exit_condition?: string;
  data_source_path?: string;
}

export interface UpdateLoopConfigurationRecord {
  loop_type: LoopType;
  max_iterations?: number | null;
  exit_condition?: string;
  data_source_path?: string;
}
