import type { Node } from "@prisma/client";
import { getNodeById, logNodeExecution, updateNodeExecutionLog } from "../services";
import { ExecutionLogEventType, ExecutionResult, ExecutionStatus, NodeCategoryType, NodeType } from "../types";
import {
  handleActionNode,
  handleConditionalNode,
  handleDataTransformNode,
  handleSwitchNode,
  handleUtilitiesNode,
} from "./node-task";
import { handleLoopNode } from "./node-task";
import { NODE_CATEGORY_MAPPER } from "../constants";

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
): Promise<{
  nodeResult: Record<string, any>;
  nextNode: Node | null;
  error?: Error | undefined;
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

    const category = NODE_CATEGORY_MAPPER[node.type as NodeType];

    switch (category) {
      case NodeCategoryType.ACTION: {
        const result = await handleActionNode(node, context, prevNodeId, groupId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        if (result.error) throw result.error;
        break;
      }

      case NodeCategoryType.FLOW_CONTROL: {
        let result: ExecutionResult = { status: nodeStatus, nextNodeId };
        if (node.type === NodeType.CONDITIONAL) {
          result = await handleConditionalNode(node, context, prevNodeId, groupId);
        } else if (node.type === NodeType.LOOP) {
          result = await handleLoopNode(node, executionId, context, executionContext, prevNodeId);
        } else if (node.type === NodeType.SWITCH) {
          result = await handleSwitchNode(node, context, prevNodeId, groupId);
        }
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        if (result.error) throw result.error;
        break;
      }

      case NodeCategoryType.DATA_TRANSFORM: {
        const result = await handleDataTransformNode(node, context, prevNodeId, groupId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        if (result.error) throw result.error;
        break;
      }

      case NodeCategoryType.UTILITIES: {
        const result = await handleUtilitiesNode(node, context, prevNodeId, groupId);
        nodeStatus = result.status;
        nextNodeId = result.nextNodeId;
        if (result.error) throw result.error;
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
      data: context.output[node.id],
    });

    return {
      nodeResult: {
        name: node.name,
        status: nodeStatus,
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
        status: nodeStatus,
      },
      nextNode: null,
      error,
    };
  }
};
