import { Node, NodeEdge } from "@prisma/client";
import { getAllOutgoingEdgesForSwitchNode } from "../../../services";
import { ExecutionStatus, NodeEdgesCondition } from "../../../types";
import { evaluateCondition } from "../../../utils";

/**
 * Handles execution of switch-type nodes
 */
export async function handleSwitchNode(
  node: Node,
  nodeLogId: string,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<{ status: ExecutionStatus; nextNodeId: string | null }> {
  let nodeStatus = ExecutionStatus.COMPLETED;

  const outgoingEdges = await getAllOutgoingEdgesForSwitchNode(node.id);
  if (!outgoingEdges.length) {
    nodeStatus = ExecutionStatus.FAILED;
    throw new Error(`Switch node ${node.id} has no cases`);
  }

  let selectedEdge: NodeEdge | undefined;

  for (const edge of outgoingEdges) {
    if (edge.condition === NodeEdgesCondition.NONE) {
      selectedEdge ??= edge; // fallback edge
      continue;
    }
    if (edge.expression) {
      const result = evaluateCondition(edge.expression, context);
      context.output[node.id] = {
        ...context.output[node.id],
        expression: edge.expression,
        success: result.status,
        matchedValue: result.value,
      };
      if (result.status) {
        console.log(`🔍 Evaluating expression: ${edge.expression} for node: ${node.name}`);
        selectedEdge = edge;
        break;
      }
    }
  }

  if (!selectedEdge) nodeStatus = ExecutionStatus.FAILED;

  return { status: nodeStatus, nextNodeId: selectedEdge?.target_node_id ?? null };
}
