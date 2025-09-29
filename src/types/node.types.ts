import { JsonConfig } from "./common.types";
import { ActionName, NodeEdgesCondition, NodeEdgeType, NodeType } from "./enums";

export interface CreateNodeRecord {
  workflow_id: string;
  type: NodeType;
  name: string;
  parent_node_id?: string;
  condition?: NodeEdgesCondition;
  actions?: CreateActionNodeRecord[];
  conditions?: CreateConditionalNodeRecord[];
}

export interface CreateNodeEdgeRecord {
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: NodeEdgeType;
  condition: NodeEdgesCondition;
}

export interface CreateActionNodeRecord {
  node_id: string;
  action_name: ActionName;
  order: number;
  params?: JsonConfig;
  retry_attempts?: number;
  retry_delay_ms?: number;
}

export interface CreateConditionalNodeRecord {
  node_id: string;
  order: number;
  expression: string;
}
