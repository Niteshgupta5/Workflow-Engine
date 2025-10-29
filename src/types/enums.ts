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
  // Action
  SEND_EMAIL = "send_email",
  SEND_HTTP_REQUEST = "send_http_request",
  UPDATE_DATABASE = "update_database",

  // Flow Control

  CONDITIONAL = "conditional",
  LOOP = "loop",
  SWITCH = "switch",
  RULE_EXECUTOR = "rule_executor",

  // Data Transformation

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

export type SwitchCaseCondition = `case_${number}`;

export enum NodeEdgesCondition {
  ON_TRUE = "on_true",
  ON_FALSE = "on_false",
  NONE = "none",
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
  TRIGGER = "trigger",
  ACTION = "action",
  FLOW_CONTROL = "flow_control",
  DATA_TRANSFORM = "data_transform",
  UTILITIES = "utilities",
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

export enum LogicalOperator {
  AND = "&&",
  OR = "||",
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
  MONTHS = "months",
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

export enum DateFormat {
  // -----------------------------
  // Full Dates
  // -----------------------------
  YYYY_MM_DD = "yyyy-MM-dd",
  DD_MM_YYYY = "dd/MM/yyyy",
  MM_DD_YYYY = "MM/dd/yyyy",
  DD_MMM_YYYY = "dd/MMM/yyyy",
  MMM_DD_YYYY = "MMM/dd/yyyy",
  YYYYMMDD = "yyyyMMdd",
  MMDDYYYY = "MMddyyyy",

  // -----------------------------
  // Date & Time
  // -----------------------------
  YYYY_MM_DD_HH_MM_SS = "yyyy-MM-dd HH:mm:ss",
  DD_MM_YYYY_HH_MM_SS = "dd/MM/yyyy HH:mm:ss",
  MM_DD_YYYY_HH_MM_SS = "MM/dd/yyyy HH:mm:ss",
  YYYY_MM_DD_hh_mm_ss_a = "yyyy-MM-dd hh:mm:ss a",
  DD_MM_YYYY_hh_mm_ss_a = "dd/MM/yyyy hh:mm:ss a",
  MM_DD_YYYY_hh_mm_ss_a = "MM/dd/yyyy hh:mm:ss a",

  // -----------------------------
  // Time Only
  // -----------------------------
  HH_MM = "HH:mm",
  HH_MM_SS = "HH:mm:ss",
  hh_mm_a = "hh:mm a",
  hh_mm_ss_a = "hh:mm:ss a",

  // -----------------------------
  // Month & Year
  // -----------------------------
  MMMM_YYYY = "MMMM yyyy",
  MMM_YYYY = "MMM yyyy",
  MM_YYYY = "MM/yyyy",

  // -----------------------------
  // Day Names / Weekday
  // -----------------------------
  EEEE = "EEEE", // Full day name (Monday)
  EEE = "EEE", // Short day name (Mon)
  do = "do", // Day with ordinal (1st, 2nd, 3rd)

  // -----------------------------
  // ISO & Timestamps
  // -----------------------------
  ISO = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", // ISO 8601
  UNIX = "t", // Timestamp in seconds
  UNIX_MS = "T", // Timestamp in milliseconds

  // -----------------------------
  // Week of Year
  // -----------------------------
  ww_yyyy = "ww-yyyy", // Week number and year
}
