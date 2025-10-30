import { NodeType } from "../types";

export const NodeOutputRegistry: Record<NodeType, string[]> = {
  // Action Nodes
  [NodeType.SEND_EMAIL]: ["from", "to", "subject", "message", "status", "timestamp"],
  [NodeType.SEND_HTTP_REQUEST]: ["url", "method", "body", "status", "response", "response_code"],
  [NodeType.UPDATE_DATABASE]: ["table", "data", "updated_count", "status"],
  [NodeType.VIP_MEMBERSHIP_INVITE]: ["response"],
  [NodeType.PEP_CHECK_INVITE]: ["response"],

  // Flow Control Nodes
  [NodeType.CONDITIONAL]: ["result"],
  [NodeType.LOOP]: ["iteration_index", "iteration_item", "loop_result"],
  [NodeType.SWITCH]: ["matched_case"],
  [NodeType.RULE_EXECUTOR]: ["result"],

  // Data Transformation Nodes
  [NodeType.MAP]: ["mapped_data", "original_data"],
  [NodeType.RENAME]: ["renamed_data", "original_data"],
  [NodeType.FILTER]: ["filtered_data", "excluded_data", "original_data"],
  [NodeType.COPY]: ["copied_data", "original_data"],
  [NodeType.AGGREGATE]: ["aggregated_data", "original_data"],
  [NodeType.GROUP]: ["grouped_data", "original_data"],
  [NodeType.CONCAT]: ["concatenated_data", "original_data"],
  [NodeType.FORMULA]: ["formula_result", "original_data"],
  [NodeType.CONVERT_TYPE]: ["converted_value", "original_data"],
  [NodeType.MERGE]: ["merged_data", "original_data"],
  [NodeType.SPLIT]: ["split_data", "original_data"],
  [NodeType.DATE_FORMAT]: ["formatted_date", "original_data"],
  [NodeType.DATE_OPERATION]: ["date_result", "original_data"],
  [NodeType.TIMESTAMP]: ["timestamp_result", "original_data"],
  [NodeType.REMOVE]: ["removed_data", "remaining_data", "original_data"],

  // Utility Nodes
  [NodeType.CODE_BLOCK]: ["code_result", "original_data"],
};
