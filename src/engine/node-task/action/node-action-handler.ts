import { Node } from "@prisma/client";
import { getNextNodeId, getNodeActions, logTaskExecution, updateTaskLog } from "../../../services";
import { ExecutionStatus, NodeEdgesCondition, TaskStatus } from "../../../types";
import { sleep } from "../../../utils";
import { actionHandlers } from "./action-handler";

/**
 * Handles execution of action-type nodes
 */
export async function handleActionNode(
  node: Node,
  nodeLogId: string,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<{ status: ExecutionStatus; nextNodeId: string | null }> {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let prevActionId = null; // To fetch results of previous action if needed

  const nodeActions = await getNodeActions(node.id);

  for (const action of nodeActions) {
    console.log(`⚡ Running action: ${action.action_name} for node: ${node.name}`);
    let attempts = 0;
    const maxAttempts = action.retry_attempts ?? 0;
    const delayMs = action.retry_delay_ms ?? 0;

    const taskLog = await logTaskExecution({
      node_log_id: nodeLogId,
      task_id: action.id,
      task_type: node.type,
      status: TaskStatus.RUNNING,
    });

    while (attempts <= maxAttempts) {
      try {
        attempts++;
        const result = await actionHandlers[action.action_name](action, context);
        context.output[action.id] = {
          action_name: action.action_name,
          result,
          retry_attempts: attempts - 1,
        };

        await updateTaskLog(taskLog.id, {
          status: TaskStatus.COMPLETED,
          data: result,
        });

        break;
      } catch (err) {
        await updateTaskLog(taskLog.id, { status: TaskStatus.FAILED, data: { error: String(err) } });
        nodeStatus = ExecutionStatus.FAILED;

        context.output[action.id] = {
          action_name: action.action_name,
          result: { error: String(err) },
          retry_attempts: attempts - 1,
        };

        if (attempts - 1 <= maxAttempts) {
          console.warn(`Action ${action.action_name} failed on attempt ${attempts - 1}, retrying in ${delayMs}ms...`);
          await sleep(delayMs);
        }
      }
    }
    prevActionId = action.id;
  }

  const nextNodeId = await getNextNodeId(node.id, NodeEdgesCondition.NONE, groupId);
  return { status: nodeStatus, nextNodeId };
}
