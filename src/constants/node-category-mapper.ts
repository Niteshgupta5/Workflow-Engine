import { NodeCategoryType, NodeType } from "../types";

export const NODE_CATEGORY_MAPPER: Record<NodeType, NodeCategoryType> = {
  [NodeType.SEND_EMAIL]: NodeCategoryType.ACTION,
  [NodeType.SEND_HTTP_REQUEST]: NodeCategoryType.ACTION,
  [NodeType.UPDATE_DATABASE]: NodeCategoryType.ACTION,

  // Flow Control
  [NodeType.CONDITIONAL]: NodeCategoryType.FLOW_CONTROL,
  [NodeType.SWITCH]: NodeCategoryType.FLOW_CONTROL,
  [NodeType.LOOP]: NodeCategoryType.FLOW_CONTROL,

  // Data Transform
  [NodeType.MAP]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.RENAME]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.REMOVE]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.COPY]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.FILTER]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.AGGREGATE]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.GROUP]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.CONCAT]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.FORMULA]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.CODE_BLOCK]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.CONVERT_TYPE]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.MERGE]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.SPLIT]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.DATE_FORMAT]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.DATE_OPERATION]: NodeCategoryType.DATA_TRANSFORM,
  [NodeType.TIMESTAMP]: NodeCategoryType.DATA_TRANSFORM,
};
