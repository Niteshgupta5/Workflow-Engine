import { Node } from "@prisma/client";
import { getNextNodeId } from "../../../services";
import { ExecutionResult, ExecutionStatus, NodeEdgesCondition } from "../../../types";
import { sleep } from "../../../utils";
import { actionHandlers } from "./action-handler";

/**
 * Handles execution of action-type nodes
 */
export async function handleActionNode(
  node: Node,
  context: Record<string, any> = {},
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<ExecutionResult> {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let error: Error | undefined = undefined;
  let attempts: number = 0;
  const maxAttempts: number = node.retry_attempts ?? 0;
  const delayMs: number = node.retry_delay_ms ?? 0;

  while (attempts <= maxAttempts) {
    try {
      const handler = actionHandlers[node.type];
      if (!handler) {
        throw new Error(`Unsupported Node type: ${node.type}`);
      }

      const result = await handler(node.config, context);
      context.output[node.id] = {
        name: node.name,
        result,
        retry_attempts: attempts,
      };

      break;
    } catch (err) {
      nodeStatus = ExecutionStatus.FAILED;

      context.output[node.id] = {
        name: node.name,
        result: { error: String(err) },
        retry_attempts: attempts,
      };

      if (attempts < maxAttempts) {
        console.warn(`Node ${node.name} failed on attempt ${attempts}, retrying in ${delayMs}ms...`);
        attempts++;
        await sleep(delayMs);
      } else {
        error = err as Error;
        break;
      }
    }
  }
  context.last_executed_task_id = node.id;

  const nextNodeId = await getNextNodeId(node.id, NodeEdgesCondition.NONE, groupId);
  return { status: nodeStatus, nextNodeId, error };
}
