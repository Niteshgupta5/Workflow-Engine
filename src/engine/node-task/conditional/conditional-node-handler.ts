import { Node } from "@prisma/client";
import { getNextNodeId } from "../../../services";
import { ConditionalConfig, ExecutionResult, ExecutionStatus, NodeEdgesCondition } from "../../../types";
import { evaluateCondition } from "../../../utils";

/**
 * Handles execution of conditional-type nodes
 * Combines multiple conditions into a single expression
 * and evaluates them only once.
 */
export async function handleConditionalNode(
  node: Node,
  context: Record<string, any>,
  groupId: string | null = null
): Promise<ExecutionResult> {
  let nodeStatus = ExecutionStatus.COMPLETED;

  const config = node.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error(`Conditional node ${node.name} configuration not found`);
  }

  const conditions = (config["conditions"] as ConditionalConfig[] | undefined) ?? [];

  if (conditions.length === 0) {
    throw new Error(`Conditional node ${node.name} has no conditions defined`);
  }

  // Combine all expressions using their operators (default AND)
  const combinedExpression = conditions
    .map((cond) => cond.expression)
    .reduce((acc, expr, idx) => {
      if (idx === 0) return expr;
      const operator = conditions[idx].operator ?? "&&"; // default AND
      return `(${acc}) ${operator} (${expr})`;
    }, "");

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

  const nextNodeId = pass
    ? await getNextNodeId(node.id, NodeEdgesCondition.ON_TRUE, groupId)
    : await getNextNodeId(node.id, NodeEdgesCondition.ON_FALSE, groupId);

  return { status: nodeStatus, nextNodeId };
}
