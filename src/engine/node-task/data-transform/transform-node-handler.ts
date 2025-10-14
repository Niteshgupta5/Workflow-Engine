import { Node } from "@prisma/client";
import { ExecutionStatus, TransformationRuleMap, NodeEdgesCondition, ExecutionResult } from "../../../types";
import { getNextNodeId } from "../../../services";
import { transformationHandlers } from "./transformation-type-handler";

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const handleDataTransformNode = async (
  node: Node,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<ExecutionResult> => {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let error: Error | undefined;

  const dataTransformConfig = node.config;
  try {
    if (!dataTransformConfig) {
      throw new Error("Data Transform configuration not found");
    }

    const prevOutput = prevNodeId ? context.output?.[prevNodeId] : context.input || context.data || {};
    const typeKey = node.type as keyof TransformationRuleMap;
    const handler = transformationHandlers[typeKey];

    if (!handler) {
      throw new Error(`Unsupported transformation type: ${node.type}`);
    }

    const result = await handler(prevOutput, dataTransformConfig as any, context);
    context.output[node.id] = {
      result,
      timestamp: new Date().toISOString(),
      transformationType: node.type,
    };
  } catch (err) {
    nodeStatus = ExecutionStatus.FAILED;
    error = err instanceof Error ? err : new Error(String(err));
  }

  const nextNodeId = await getNextNodeId(node.id, NodeEdgesCondition.NONE, groupId);
  return { status: nodeStatus, nextNodeId, error };
};
