import type { Node } from "@prisma/client";
import { getNodeById, logNodeExecution, updateNodeExecutionLog } from "../services";
import { ExecutionLogEventType, ExecutionStatus, NodeType } from "../types";
import { handleActionNode, handleConditionalNode, handleDataTransformNode, handleSwitchNode } from "./node-task";
import { handleLoopNode } from "./node-task";

/**
 * Main node runner
 */
export const runNode = async (
  executionId: string,
  node: Node,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<{ nodeResult: Record<string, any>; nextNode: Node | null; error?: Error | undefined }> => {
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
      data: context,
    });

    switch (node.type) {
      case NodeType.ACTION: {
        const result = await handleActionNode(node, nodeLog.id, context, prevNodeId, groupId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        if (result.error) throw result.error;
        break;
      }

      case NodeType.CONDITIONAL: {
        const result = await handleConditionalNode(node, nodeLog.id, context, prevNodeId, groupId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        break;
      }

      case NodeType.LOOP: {
        const result = await handleLoopNode(node, executionId, context, executionContext, prevNodeId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        break;
      }

      case NodeType.SWITCH: {
        const result = await handleSwitchNode(node, executionId, context, prevNodeId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        break;
      }

      case NodeType.DATA_TRANSFORM: {
        const result = await handleDataTransformNode(node, nodeLog.id, context, prevNodeId, groupId);
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
      status: nodeStatus,
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
  } catch (error: any) {
    await logNodeExecution({
      execution_id: executionId,
      node_id: node.id,
      status: ExecutionLogEventType.FAILURE,
      data: { error: error.message },
    });
    return {
      nodeResult: {
        name: node.name,
        status: nodeStatus,
      },
      nextNode: null,
      error,
    };
  }
};
