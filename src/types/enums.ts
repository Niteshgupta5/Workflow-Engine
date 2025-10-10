export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export enum AuthType {
  NONE = "none",
  BASIC = "basic",
  HEADER = "header",
}

export enum TriggerType {
  WEBHOOK = "webhook",
  SCHEDULE = "schedule",
  EVENT = "event",
  HTTP_REQUEST = "http_request",
}

export enum NodeType {
  ACTION = "action",
  CONDITIONAL = "conditional",
  LOOP = "loop",
  SWITCH = "switch",
  DATA_TRANSFORM = "data_transform",
}

export type SwitchCaseCondition = `case_${number}`;

export enum NodeEdgesCondition {
  ON_TRUE = "on_true",
  ON_FALSE = "on_false",
  NONE = "none",
}

export enum ActionName {
  SEND_EMAIL = "send_email",
  SEND_HTTP_REQUEST = "send_http_request",
  UPDATE_DATABASE = "update_database",
}

export enum ExecutionStatus {
  RUNNING = "running",
  FAILED = "failed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ExecutionLogEventType {
  START = "start",
  SUCCESS = "success",
  FAILURE = "failure",
  RETRY = "retry",
}

export enum TaskType {
  ACTION = "action",
  CONDITIONAL = "conditional",
}

export enum TaskStatus {
  RUNNING = "running",
  FAILED = "failed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum LoopType {
  FOR_EACH = "for_each",
  FIXED = "fixed_count",
  WHILE = "while_loop",
}

export enum NodeCategoryType {
  ACTION = "action",
  FLOW_CONTROL = "flow_control",
  DATA_TRANSFORM = "data_transform",
}

export enum TransformationType {
  MAP = "map",
  RENAME = "rename",
  REMOVE = "remove",
  COPY = "copy",
  FILTER = "filter",
  AGGREGATE = "aggregate",
  GROUP = "group",
  CONCAT = "concat",
  FORMULA = "formula",
  CODE_BLOCK = "code_block",
  CONVERT_TYPE = "convert_type",
  MERGE = "merge",
  SPLIT = "split",
  // UPPERCASE = "uppercase",
  // LOWERCASE = "lowercase",
  // SUBSTRING = "substring",
  // REPLACE = "replace",
  DATE_FORMAT = "date_format",
  DATE_OPERATION = "date_operation",
  TIMESTAMP = "timestamp",
}
