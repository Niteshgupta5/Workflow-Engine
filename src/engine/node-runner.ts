import type { Node } from "@prisma/client";
import { getNodeById, logNodeExecution, updateNodeExecutionLog } from "../services";
import { ExecutionLogEventType, ExecutionResult, ExecutionStatus, ExtendedNode, NodeType } from "../types";
import { NodeExecutorFn, taskExecutors } from "./taskExecutor";

/**
 * Main node runner
 */
export const runNode = async <T extends NodeType>(
  executionId: string,
  node: ExtendedNode<T>,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<{
  nodeResult: Record<string, any>;
  nextNode: Node | null;
  error?: Error;
}> => {
  let nextNodeId: string | null = null;
  let nodeStatus: ExecutionStatus = ExecutionStatus.COMPLETED;
  console.log("Node Executed", node.name);

  try {
    if (!context.input) context.input = context;
    if (!context.output) context.output = {};

    const nodeLog = await logNodeExecution({
      execution_id: executionId,
      node_id: node.id,
      status: ExecutionLogEventType.START,
      started_at: new Date(),
    });

    // Get the executor function
    const nodeBlockHandler = taskExecutors[node.type] as NodeExecutorFn<T>;

    // Execute the node
    const nodeResult = await nodeBlockHandler({
      node,
      context,
      executionContext,
      groupId,
    });

    await updateNodeExecutionLog(nodeLog.id, {
      status: nodeStatus,
      completed_at: new Date(),
      data: context.output[node.id],
    });

    // Use type assertion and optional chaining to avoid type error
    nextNodeId = (nodeResult as ExecutionResult)?.nextNodeId ?? null;

    return {
      nodeResult: {
        name: node.name,
        status: nodeStatus,
        ...nodeResult,
      },
      nextNode: nextNodeId ? await getNodeById(nextNodeId) : null,
    };
  } catch (error: any) {
    console.log("Error: Node Runner");
    await logNodeExecution({
      execution_id: executionId,
      node_id: node.id,
      status: ExecutionLogEventType.FAILURE,
      data: { error: error.message },
    });
    return {
      nodeResult: {
        name: node.name,
        status: ExecutionStatus.FAILED,
      },
      nextNode: null,
      error,
    };
  }
};
