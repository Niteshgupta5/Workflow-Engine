import { Node } from "@prisma/client";
import { getNodeById } from "../../../services";
import { ExecutionStatus } from "../../../types";
import { runNode } from "../../node-runner";

export async function executeSubgraph(
  loopNode: Node,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  executionId: string,
  nodeStatus: ExecutionStatus,
  nextNodeId: string,
  iteration: number
): Promise<void> {
  const nextNode = await getNodeById(nextNodeId);

  let currentNode: Node | null = nextNode;
  let prevNodeId = loopNode.id;
  do {
    const result = await runNode(executionId, currentNode, context, executionContext, prevNodeId, loopNode.id);
    nodeStatus = result.nodeResult["status"];
    if (!executionContext.output[currentNode.id]) {
      executionContext.output[currentNode.id] = { loop_node_id: loopNode.id };
    }
    executionContext.output[currentNode.id][iteration] = result.nodeResult;
    prevNodeId = currentNode.id;
    currentNode = result.nextNode;
  } while (currentNode?.id !== loopNode.id && currentNode !== null);
}
