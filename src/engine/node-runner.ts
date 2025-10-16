import type { Node } from "@prisma/client";
import {
  getNextNodeAfterLoop,
  getNextNodeId,
  getNodeById,
  logNodeExecution,
  updateNodeExecutionLog,
} from "../services";
import {
  ExecutionLogEventType,
  ExecutionStatus,
  ExtendedNode,
  NodeCategoryType,
  NodeConfig,
  NodeConfigMap,
  NodeEdgesCondition,
  NodeResponse,
  NodeType,
  SwitchCaseCondition,
} from "../types";
import { NodeExecutorFn, taskExecutors } from "./taskExecutor";
import { NODE_CATEGORY_MAPPER } from "../constants";
import { resolveNextNodeId } from "../utils";

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

    context.output[node.id] = nodeResult;

    await updateNodeExecutionLog(nodeLog.id, {
      status: nodeStatus,
      completed_at: new Date(),
      data: context.output[node.id],
    });

    nextNodeId = await resolveNextNodeId(node.id, node.type, groupId, nodeResult);

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
