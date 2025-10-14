import { Node, Edge } from "@prisma/client";
import { NodeEdgesCondition, NodeType, SwitchCaseCondition } from "./enums";
import { DataTransformationRuleConfig, TransformationRuleMap } from "./data-transform.types";
import { SendHttpRequest, SendEmail, UpdateDatabase } from "./action.types";
import { ConditionalConfig, LoopConfig, SwitchConfig } from "./flow-control.types";

export interface CreateNodeRecord {
  workflow_id: string;
  type: NodeType;
  name: string;
  prev_node_id?: string;
  next_node_id?: string;
  group_id?: string;
  condition: NodeEdgesCondition | SwitchCaseCondition;
  configuration: NodeConfiguration;
  retry_attempts?: number;
  retry_delay_ms?: number;
}

export interface UpdateNodeRecord {
  type: NodeType;
  name: string;
  configuration?: NodeConfiguration;
  retry_attempts?: number;
  retry_delay_ms?: number;
}

export interface CreateNodeEdgeRecord {
  workflow_id: string;
  source: string;
  target: string;
  group_id?: string;
  condition: NodeEdgesCondition | SwitchCaseCondition;
  expression?: string;
}

export interface UpdateNodeEdgeRecord {
  source?: string;
  target?: string;
  group_id?: string;
  condition?: NodeEdgesCondition | SwitchCaseCondition;
  expression?: string;
}

export interface GetNodeEdgeWithRelation extends Edge {
  sourceNode?: Node;
  targetNode?: Node;
}

export interface NodeConfigurationMap extends Partial<TransformationRuleMap> {
  [NodeType.SEND_EMAIL]?: SendEmail;
  [NodeType.SEND_HTTP_REQUEST]?: SendHttpRequest;
  [NodeType.UPDATE_DATABASE]?: UpdateDatabase;

  // Flow Control
  [NodeType.CONDITIONAL]?: { conditions: ConditionalConfig[] };
  [NodeType.LOOP]?: LoopConfig;
  [NodeType.SWITCH]?: { switch_cases: SwitchConfig[] };
}

export type NodeConfiguration =
  | SendEmail
  | SendHttpRequest
  | UpdateDatabase
  | { conditions: ConditionalConfig[] }
  | { switch_cases: SwitchConfig[] }
  | LoopConfig
  | DataTransformationRuleConfig;
