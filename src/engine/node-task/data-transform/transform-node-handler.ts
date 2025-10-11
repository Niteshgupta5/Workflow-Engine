import { Node } from "@prisma/client";
import { ExecutionStatus, NodeEdgesCondition, TaskStatus } from "../../../types";
import { getDataTransformNodeById, getNextNodeId, logTaskExecution } from "../../../services";

/**
 * Handles execution of data-transform nodes
 */
export async function handleDataTransformNode(
  node: Node,
  nodeLogId: string,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<{ status: ExecutionStatus; nextNodeId: string | null; error?: Error }> {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let error: Error | undefined = undefined;

  const dataTransformNode = await getDataTransformNodeById(node.id);
  const taskLog = await logTaskExecution({
    node_log_id: nodeLogId,
    task_id: dataTransformNode.id,
    task_type: node.type,
    status: TaskStatus.RUNNING,
  });

  if (!dataTransformNode.transform_rules) {
    nodeStatus = ExecutionStatus.FAILED;
    throw new Error(`Transform Rules not exists.`);
  }
  switch (dataTransformNode.transformation_type) {
  }

  const nextNodeId = await getNextNodeId(node.id, NodeEdgesCondition.NONE, groupId);
  return { status: nodeStatus, nextNodeId, error };
}
