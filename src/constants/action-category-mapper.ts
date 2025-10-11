import { ActionName, FlowControlActionName, NodeCategoryType, TransformationType, TriggerType } from "../types";

export const ACTION_CATEGORY_MAPPER = {
  [NodeCategoryType.ACTION]: [...Object.values(ActionName)],
  [NodeCategoryType.FLOW_CONTROL]: [...Object.values(FlowControlActionName)],
  [NodeCategoryType.DATA_TRANSFORM]: [...Object.values(TransformationType)],
  Trigger: [...Object.values(TriggerType)],
};
