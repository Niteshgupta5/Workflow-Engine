import { Node } from "@prisma/client";
import { getNodeById } from "../../../services";
import { ExecutionStatus, ExtendedNode, NodeType } from "../../../types";
import { runNode } from "../../node-runner";

export async function executeSubgraph<T extends NodeType>(
  loopNode: ExtendedNode<T>,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  executionId: string,
  nodeStatus: ExecutionStatus,
  nextNodeId: string,
  iteration: number
): Promise<ExecutionStatus> {
  const nextNode = await getNodeById(nextNodeId);

  let currentNode: Node | null = nextNode;
  let prevNodeId: string | null = loopNode.id;

  do {
    // Type assertion for properly typed node
    const typedNode = currentNode as ExtendedNode<T>;

    const { nextNode, nodeResult, error } = (await runNode(
      executionId,
      typedNode,
      context,
      executionContext,
      prevNodeId,
      loopNode.id // groupId is the loop node id
    )) as { nextNode: ExtendedNode<T>; nodeResult: { status: ExecutionStatus }; error: any };

    // Update status from result
    nodeStatus = nodeResult.status as ExecutionStatus;
    // Initialize output structure for this node if not exists
    if (!executionContext.output[currentNode.id]) {
      executionContext.output[currentNode.id] = {
        loop_node_id: loopNode.id,
      };
    }

    // Store result for this iteration
    executionContext.output[currentNode.id][iteration] = nodeResult;

    // Handle errors
    if (error) {
      throw error;
    }

    // Move to next node
    prevNodeId = currentNode.id;
    currentNode = nextNode;

    // Continue until we loop back to the loop node or reach the end
  } while (currentNode !== null && currentNode.id !== loopNode.id);

  return nodeStatus;
}
