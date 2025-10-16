import { Node } from "@prisma/client";
import {
  ConditionalConfig,
  ConditionalResponse,
  ExecutionStatus,
  ExtendedNode,
  LogicalOperator,
  NodeType,
} from "../../../types";
import { evaluateCondition, mergeConditions } from "../../../utils";

/**
 * Handles execution of conditional-type nodes
 * Combines multiple conditions into a single expression
 * and evaluates them only once.
 */
export async function handleConditionalNode(
  node: ExtendedNode<NodeType>,
  context: Record<string, any>
): Promise<ConditionalResponse> {
  let nodeStatus = ExecutionStatus.COMPLETED;

  const config = node.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error(`Conditional node ${node.name} configuration not found`);
  }

  const conditions = (config["conditions"] as ConditionalConfig[]) ?? [];

  if (conditions.length === 0) {
    throw new Error(`Conditional node ${node.name} has no conditions defined`);
  }

  // Combine all expressions using their operators (default AND)
  const combinedExpression = mergeConditions(conditions);
  let pass = true;

  try {
    // Evaluate combined expression once
    const result = evaluateCondition(combinedExpression, context);

    // Store output for this node
    context.output[node.id] = {
      expression: combinedExpression,
      success: result.status,
      matchedValue: result.value,
    };

    pass = result.status;
  } catch (err) {
    pass = false;
    nodeStatus = ExecutionStatus.FAILED;
    throw err;
  }

  return { status: nodeStatus, expressionResult: pass };
}
