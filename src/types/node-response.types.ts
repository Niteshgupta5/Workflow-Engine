// =============================
// Action Nodes

import { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { ExecutionResult } from "./common.types";
import { HttpMethod, NodeType } from "./enums";

// =============================
export type SendEmailResponse = {
  from: string;
  to: string;
  subject: string;
  message?: string;
  status: "sent" | "failed";
  timestamp: string; // ISO string
};

export type SendHttpRequestResponse = {
  url: string;
  method: HttpMethod;
  body?: JsonValue;
  status: "success" | "failure";
  response: unknown; // can be string, object, array, etc.
  response_code: number;
};

export type UpdateDatabaseResponse = {
  table: string;
  data: JsonValue;
  updated_count: number;
  status: "success" | "failure";
};

// =============================
// Flow Control Nodes
// =============================
export type ConditionalResponse = ExecutionResult;

export type LoopResponse<ItemType = unknown> = {
  iteration_index: number;
  iteration_item: ItemType;
  loop_result: unknown[];
};

export type SwitchResponse = {
  matched_case: string;
};

// =============================
// Data Transformation Nodes
// =============================
export type MapResponse<InputType = JsonValue> = {
  mapped_data: JsonValue;
  original_data?: InputType;
};

export type RenameResponse<InputType = JsonValue> = {
  renamed_data: JsonValue | JsonValue[];
  original_data?: InputType;
};

export type RemoveResponse<InputType = JsonValue> = {
  removed_data: JsonValue | JsonValue[]; // array of removed field names
  remaining_data: JsonValue | JsonValue[];
  original_data: InputType;
};

export type FilterResponse<InputType = JsonValue> = {
  filtered_data: InputType[];
  excluded_data: InputType[];
  original_data: InputType[];
};

export type CopyResponse<InputType = JsonValue> = {
  copied_data: JsonValue;
  original_data: InputType;
};

export type AggregateResponse<InputType = JsonValue> = {
  aggregated_data: JsonValue;
  original_data: InputType[];
};

export type GroupResponse<InputType = JsonValue> = {
  grouped_data: Record<string, InputType[]>;
  original_data: InputType[];
};

export type ConcatResponse<T extends JsonValue = JsonObject> = {
  concatenated_data: T[];
  original_data: T[];
};

export type FormulaResponse<InputType = JsonValue> = {
  formula_result: unknown;
  original_data: InputType;
};

export type CodeBlockResponse<InputType = JsonValue> = {
  code_result: unknown;
  original_data: InputType;
};

export type ConvertTypeResponse = {
  converted_value: JsonValue | JsonValue[];
  original_data: unknown;
};

export type MergeResponse<InputType = JsonValue> = {
  merged_data: JsonValue;
  original_data: InputType[];
};

export type SplitResponse = {
  split_data: string[] | JsonValue[];
  original_data: string;
};

export type DateFormatResponse = {
  formatted_date: string | JsonValue;
  original_data: JsonValue;
};

export type DateOperationResponse = {
  date_result: Date | JsonValue;
  original_data: Date | string | JsonValue;
};

export type TimestampResponse = {
  timestamp_result: number | JsonValue; // unix timestamp in ms
  original_data: Date | string | JsonValue;
};

// =============================
// Node Response Map
// =============================
export type NodeResponseMap = {
  [NodeType.SEND_EMAIL]: SendEmailResponse;
  [NodeType.SEND_HTTP_REQUEST]: SendHttpRequestResponse;
  [NodeType.UPDATE_DATABASE]: UpdateDatabaseResponse;

  [NodeType.CONDITIONAL]: ConditionalResponse;
  [NodeType.LOOP]: LoopResponse;
  [NodeType.SWITCH]: SwitchResponse;

  [NodeType.MAP]: MapResponse;
  [NodeType.RENAME]: RenameResponse;
  [NodeType.REMOVE]: RemoveResponse;
  [NodeType.COPY]: CopyResponse;
  [NodeType.FILTER]: FilterResponse;
  [NodeType.AGGREGATE]: AggregateResponse;
  [NodeType.GROUP]: GroupResponse;
  [NodeType.CONCAT]: ConcatResponse;
  [NodeType.FORMULA]: FormulaResponse;
  [NodeType.CONVERT_TYPE]: ConvertTypeResponse;
  [NodeType.MERGE]: MergeResponse;
  [NodeType.SPLIT]: SplitResponse;
  [NodeType.DATE_FORMAT]: DateFormatResponse;
  [NodeType.DATE_OPERATION]: DateOperationResponse;
  [NodeType.TIMESTAMP]: TimestampResponse;

  [NodeType.CODE_BLOCK]: CodeBlockResponse;
};

// =============================
// Helper Type
// =============================
export type NodeResponse<T extends NodeType> = NodeResponseMap[T];
