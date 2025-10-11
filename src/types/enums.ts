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

export enum FlowControlActionName {
  CONDITIONAL = NodeType.CONDITIONAL,
  LOOP = NodeType.LOOP,
  SWITCH = NodeType.SWITCH,
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
export enum CodeBlockLanguage {
  JAVASCRIPT = "javascript",
  PYTHON = "python",
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
  DATE_FORMAT = "date_format",
  DATE_OPERATION = "date_operation",
  TIMESTAMP = "timestamp",
}

export enum ComparisonOperator {
  EQUALS = "==",
  STRICT_EQUALS = "===",
  NOT_EQUALS = "!=",
  GREATER_THAN = ">",
  LESS_THAN = "<",
  GREATER_THAN_OR_EQUAL = ">=",
  LESS_THAN_OR_EQUAL = "<=",
  CONTAINS = "contains",
  STARTS_WITH = "startsWith",
  ENDS_WITH = "endsWith",
  IN = "in",
  NOT_IN = "notIn",
  EXISTS = "exists",
  NOT_EXISTS = "notExists",
}

export enum AggregationOperation {
  SUM = "sum",
  AVG = "avg",
  AVERAGE = "average",
  COUNT = "count",
  MIN = "min",
  MAX = "max",
  FIRST = "first",
  LAST = "last",
  UNIQUE = "unique",
  JOIN = "join",
}

export enum DateOperation {
  ADD = "add",
  SUBTRACT = "subtract",
}

export enum TimeUnit {
  MILLISECONDS = "milliseconds",
  SECONDS = "seconds",
  MINUTES = "minutes",
  HOURS = "hours",
  DAYS = "days",
  WEEKS = "weeks",
  YEARS = "years",
}

export enum FormatType {
  ISO = "ISO",
  DATE = "DATE",
  TIME = "TIME",
  DATETIME = "DATETIME",
  TIMESTAMP = "TIMESTAMP",
}

export enum ConversionType {
  STRING = "string",
  NUMBER = "number",
  INTEGER = "integer",
  BOOLEAN = "boolean",
  DATE = "date",
  ARRAY = "array",
  OBJECT = "object",
}

export enum MergeStrategy {
  SHALLOW = "shallow",
  DEEP = "deep",
}

export enum TimestampOperation {
  TO_TIMESTAMP = "toTimestamp",
  FROM_TIMESTAMP = "fromTimestamp",
}
