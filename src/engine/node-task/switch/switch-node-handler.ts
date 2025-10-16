import { Edge, Node } from "@prisma/client";
import { getAllOutgoingEdgesForSwitchNode } from "../../../services";
import { ExecutionStatus, NodeEdgesCondition, SwitchCaseCondition, SwitchResponse } from "../../../types";
import { evaluateCondition } from "../../../utils";

/**
 * Handles execution of switch-type nodes
 */
export async function handleSwitchNode(node: Node, context: Record<string, any>): Promise<SwitchResponse> {
  let nodeStatus = ExecutionStatus.COMPLETED;

  try {
    const outgoingEdges = await getAllOutgoingEdgesForSwitchNode(node.id);
    if (!outgoingEdges.length) {
      nodeStatus = ExecutionStatus.FAILED;
      throw new Error(`Switch node ${node.name} has no cases`);
    }

    let selectedEdge: Edge | undefined;

    for (const edge of outgoingEdges) {
      if (edge.condition === NodeEdgesCondition.NONE) {
        selectedEdge ??= edge; // fallback edge
        continue;
      }
      if (edge.expression) {
        console.log(`Evaluate ${edge.condition}`);
        const result = evaluateCondition(edge.expression, context);
        context.output[node.id] = {
          ...context.output[node.id],
          expression: edge.expression,
          success: result.status,
          matchedValue: result.value,
        };
        if (result.status) {
          console.log(`🔍 Evaluation Verified: ${edge.expression} for node: ${node.name}`);
          selectedEdge = edge;
          break;
        }
      }
    }

    if (!selectedEdge) throw new Error("Case not matched.");

    return {
      matchedCaseLabel: selectedEdge.condition as SwitchCaseCondition,
      matchedCaseId: selectedEdge.target,
    };
  } catch (err) {
    throw err;
  }
}
