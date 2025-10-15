import { NodeCategoryType } from "../../types";

export const NODE_CATEGORIES = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: NodeCategoryType.ACTION,
    description: "Executes actions like HTTP requests, emails, etc.",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: NodeCategoryType.DATA_TRANSFORM,
    description: "Transforms input data (map, filter, aggregate)",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: NodeCategoryType.FLOW_CONTROL,
    description: "Flow control nodes like conditional, loop, and switch",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: NodeCategoryType.UTILITIES,
    description: "Utility nodes provide control and data manipulation within the workflow.",
  },
];
