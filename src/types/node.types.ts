import { Node, Edge } from "@prisma/client";
import { NodeEdgesCondition, NodeType, SwitchCaseCondition } from "./enums";
import {
  AggregateNodeConfig,
  CodeBlockNodeConfig,
  ConcatNodeConfig,
  ConditionalConfig,
  ConvertTypeNodeConfig,
  CopyNodeConfig,
  DateFormatNodeConfig,
  DateOperationNodeConfig,
  FilterNodeConfig,
  GroupNodeConfig,
  LoopConfig,
  MappingNodeConfig,
  MergeNodeConfig,
  NodeConfig,
  NodeConfigMap,
  RemoveNodeConfig,
  RenameNodeConfig,
  SendEmailConfig,
  SendHttpRequestConfig,
  SplitNodeConfig,
  SwitchConfig,
  TimestampNodeConfig,
  UpdateDatabaseConfig,
} from "./node-config.types";

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

export type NodeConfiguration =
  | SendEmailConfig
  | SendHttpRequestConfig
  | UpdateDatabaseConfig
  | LoopConfig
  | { conditions: ConditionalConfig[] }
  | { switch_cases: SwitchConfig[] }
  | MappingNodeConfig
  | RenameNodeConfig
  | RemoveNodeConfig
  | FilterNodeConfig
  | ConvertTypeNodeConfig
  | MergeNodeConfig
  | SplitNodeConfig
  | DateFormatNodeConfig
  | DateOperationNodeConfig
  | TimestampNodeConfig
  | CopyNodeConfig
  | AggregateNodeConfig
  | GroupNodeConfig
  | ConcatNodeConfig
  | CodeBlockNodeConfig;

export type ExtendedNode<T extends NodeType> = Node & {
  type: T;
  config: T extends keyof NodeConfigMap ? NodeConfig<T> : never;
};
