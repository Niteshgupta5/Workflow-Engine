import type { Node } from "@prisma/client";
import { getNodeById, logNodeExecution, updateNodeExecutionLog } from "../services";
import { ExecutionLogEventType, ExecutionStatus, NodeType } from "../types";
import { handleActionNode, handleConditionalNode } from "./node-task";
import { handleLoopNode } from "./node-task";

/**
 * Main node runner
 */
export const runNode = async (
  executionId: string,
  node: Node,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<{ nodeResult: Record<string, any>; nextNode: Node | null }> => {
  let nextNodeId: string | null = null;
  let nodeStatus: ExecutionStatus = ExecutionStatus.COMPLETED;
  console.log("Node Executed", node.name);

  try {
    if (!context.input) context.input = context;
    if (!context.output) context.output = {};

    const nodeLog = await logNodeExecution({
      execution_id: executionId,
      node_id: node.id,
      event_type: ExecutionLogEventType.START,
      started_at: new Date(),
      data: context,
    });

    switch (node.type) {
      case NodeType.ACTION: {
        const result = await handleActionNode(node, nodeLog.id, context, prevNodeId, groupId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        break;
      }

      case NodeType.CONDITIONAL: {
        const result = await handleConditionalNode(node, nodeLog.id, context, prevNodeId, groupId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        break;
      }

      case NodeType.LOOP: {
        const result = await handleLoopNode(node, executionId, context, prevNodeId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        break;
      }

      default:
        console.warn(`Unknown node type: ${node.type}`);
        nodeStatus = ExecutionStatus.FAILED;
        break;
    }

    await updateNodeExecutionLog(nodeLog.id, {
      event_type: nodeStatus,
      completed_at: new Date(),
      data: context,
    });

    return {
      nodeResult: {
        name: node.name,
        status: nodeStatus,
      },
      nextNode: nextNodeId ? await getNodeById(nextNodeId) : null,
    };
  } catch (err: any) {
    await logNodeExecution({
      execution_id: executionId,
      node_id: node.id,
      event_type: ExecutionLogEventType.FAILURE,
      data: { error: err.message },
    });
    throw err;
  }
};
