import { NodeCategoryType, NodeType } from "../../types";

export const NODE_TEMPLATES = [
  // Action Nodes
  {
    name: "Send Email",
    type: NodeType.SEND_EMAIL,
    category: NodeCategoryType.ACTION,
    description: "Send an email using SMTP or API integration",
  },
  {
    name: "HTTP Request",
    type: NodeType.SEND_HTTP_REQUEST,
    category: NodeCategoryType.ACTION,
    description: "Send an HTTP request to an API endpoint",
  },
  {
    name: "Update Database",
    type: NodeType.UPDATE_DATABASE,
    category: NodeCategoryType.ACTION,
    description: "Update or insert data into a database table",
  },
  {
    name: "VIP Membership Invite",
    type: NodeType.VIP_MEMBERSHIP_INVITE,
    category: NodeCategoryType.ACTION,
    description: "Send an invitation to VIP membership",
  },
  {
    name: "PEP Check Invite",
    type: NodeType.PEP_CHECK_INVITE,
    category: NodeCategoryType.ACTION,
    description: "Send an invitation for Politically Exposed Person (PEP) check",
  },

  // Flow Control
  {
    name: "Conditional",
    type: NodeType.CONDITIONAL,
    category: NodeCategoryType.FLOW_CONTROL,
    description: "Execute branches based on a true/false condition",
  },
  {
    name: "Loop",
    type: NodeType.LOOP,
    category: NodeCategoryType.FLOW_CONTROL,
    description: "Iterate through a list of items",
  },
  {
    name: "Switch",
    type: NodeType.SWITCH,
    category: NodeCategoryType.FLOW_CONTROL,
    description: "Branch execution based on multiple cases",
  },
  {
    name: "Rule Executor",
    type: NodeType.RULE_EXECUTOR,
    category: NodeCategoryType.FLOW_CONTROL,
    description: "Execute a set of rules based on defined conditions",
  },

  // Data Transformation
  ...[
    NodeType.MAP,
    NodeType.RENAME,
    NodeType.REMOVE,
    NodeType.COPY,
    NodeType.FILTER,
    NodeType.AGGREGATE,
    NodeType.GROUP,
    NodeType.CONCAT,
    NodeType.FORMULA,
    NodeType.CODE_BLOCK,
    NodeType.CONVERT_TYPE,
    NodeType.MERGE,
    NodeType.SPLIT,
    NodeType.DATE_FORMAT,
    NodeType.DATE_OPERATION,
    NodeType.TIMESTAMP,
  ].map((type) => ({
    name: type.replace(/_/g, " ").toLowerCase(),
    type,
    category: NodeCategoryType.DATA_TRANSFORM,
    description: `Performs ${type.replace(/_/g, " ").toLowerCase()} transformation`,
  })),

  // Utilities
  ...[NodeType.CODE_BLOCK].map((type) => ({
    name: type.replace(/_/g, " ").toLowerCase(),
    type,
    category: NodeCategoryType.UTILITIES,
    description: `Performs custom code ${type.replace(/_/g, " ").toLowerCase()} execution`,
  })),
];
