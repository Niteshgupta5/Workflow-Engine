import { Node } from "@prisma/client";
import { getNodeById } from "../../../services";
import { ExecutionStatus } from "../../../types";
import { runNode } from "../../node-runner";

export async function executeSubgraph(
  loopNode: Node,
  context: Record<string, any>,
  executionId: string,
  nodeStatus: ExecutionStatus,
  nextNodeId: string
): Promise<void> {
  const nextNode = await getNodeById(nextNodeId);

  let currentNode: Node | null = nextNode;
  let prevNodeId = loopNode.id;
  do {
    const result = await runNode(executionId, currentNode, context, prevNodeId, loopNode.id);
    nodeStatus = result.nodeResult["status"];
    prevNodeId = currentNode.id;
    currentNode = result.nextNode;
  } while (currentNode?.id !== loopNode.id && currentNode !== null);
}
