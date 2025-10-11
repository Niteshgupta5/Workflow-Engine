import { NodeCategoryType, NodeType } from "../types";

export const NODE_CATEGORY_MAPPER = {
  [NodeType.ACTION]: NodeCategoryType.ACTION,
  [NodeType.CONDITIONAL]: NodeCategoryType.FLOW_CONTROL,
  [NodeType.SWITCH]: NodeCategoryType.FLOW_CONTROL,
  [NodeType.LOOP]: NodeCategoryType.FLOW_CONTROL,
  [NodeType.DATA_TRANSFORM]: NodeCategoryType.DATA_TRANSFORM,
};
