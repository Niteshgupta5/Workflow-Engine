import { Node } from "@prisma/client";
import { getNextNodeId } from "../../../services";
import { ConditionalConfig, ExecutionResult, ExecutionStatus, NodeEdgesCondition } from "../../../types";
import { evaluateCondition } from "../../../utils";

/**
 * Handles execution of conditional-type nodes
 */
export async function handleConditionalNode(
  node: Node,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<ExecutionResult> {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let error: Error | undefined = undefined;
  let pass = true;

  const config = node.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error(`Conditional node ${node.name} configuration not found`);
  }
  const conditions = (config["conditions"] as ConditionalConfig[] | undefined) ?? [];

  for (const condition of conditions) {
    try {
      const result = evaluateCondition(condition.expression, context);
      context.output[node.id] = {
        expression: condition.expression,
        success: result.status,
        matchedValue: result.value,
      };

      pass = result.status;
    } catch (err) {
      pass = false;
      nodeStatus = ExecutionStatus.FAILED;
      error = err as Error;
      break;
    }
  }

  const nextNodeId = pass
    ? await getNextNodeId(node.id, NodeEdgesCondition.ON_TRUE, groupId)
    : await getNextNodeId(node.id, NodeEdgesCondition.ON_FALSE, groupId);

  return { status: nodeStatus, nextNodeId, error };
}
