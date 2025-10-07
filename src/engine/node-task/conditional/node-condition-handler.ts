import { Node } from "@prisma/client";
import { getNextNodeId, getNodeConditions, logTaskExecution, updateTaskLog } from "../../../services";
import { ExecutionStatus, NodeEdgesCondition, TaskStatus } from "../../../types";
import { evaluateCondition } from "../../../utils";

/**
 * Handles execution of conditional-type nodes
 */
export async function handleConditionalNode(
  node: Node,
  nodeLogId: string,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<{ status: ExecutionStatus; nextNodeId: string | null }> {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let pass = true;
  let prevConditionId = null; // To fetch results of previous condition if needed

  const nodeConditions = await getNodeConditions(node.id);

  for (const condition of nodeConditions) {
    console.log(`🔍 Evaluating condition: ${condition.expression} for node: ${node.name}`);

    const taskLog = await logTaskExecution({
      node_log_id: nodeLogId,
      task_id: condition.id,
      task_type: node.type,
      status: TaskStatus.RUNNING,
    });

    try {
      const result = evaluateCondition(condition.expression, context);
      context.output[condition.id] = {
        expression: condition.expression,
        success: result.status,
        matchedValue: result.value,
      };

      await updateTaskLog(taskLog.id, {
        status: TaskStatus.COMPLETED,
        data: { success: result.status, matchedValue: result.value },
      });
      pass = result.status;
    } catch (error) {
      pass = false;
      nodeStatus = ExecutionStatus.FAILED;
      await updateTaskLog(taskLog.id, {
        status: TaskStatus.FAILED,
        data: { error: String(error) },
      });
    }
    prevConditionId = condition.id;
  }

  const nextNodeId = pass
    ? await getNextNodeId(node.id, NodeEdgesCondition.ON_TRUE, groupId)
    : await getNextNodeId(node.id, NodeEdgesCondition.ON_FALSE, groupId);

  return { status: nodeStatus, nextNodeId };
}
