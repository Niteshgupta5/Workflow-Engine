import { Node } from "@prisma/client";
import { ExecutionStatus, NodeEdgesCondition, ExecutionResult, UtilityMap } from "../../../types";
import { getNextNodeId } from "../../../services";
import { utilityTypeHandlers } from "./utility-type-handler";

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const handleUtilitiesNode = async (
  node: Node,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<ExecutionResult> => {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let error: Error | undefined;

  const utilityConfig = node.config;
  try {
    if (!utilityConfig) {
      throw new Error("Utility Node configuration not found");
    }

    const prevOutput = prevNodeId ? context.output?.[prevNodeId] : context.input || context.data || {};
    const typeKey = node.type as keyof UtilityMap;
    const handler = utilityTypeHandlers[typeKey];

    if (!handler) {
      throw new Error(`Unsupported utility type: ${node.type}`);
    }

    const result = await handler(prevOutput, utilityConfig as any, context);
    context.output[node.id] = {
      result,
      timestamp: new Date().toISOString(),
      utilityType: node.type,
    };
  } catch (err) {
    nodeStatus = ExecutionStatus.FAILED;
    error = err instanceof Error ? err : new Error(String(err));
  }

  const nextNodeId = await getNextNodeId(node.id, NodeEdgesCondition.NONE, groupId);
  return { status: nodeStatus, nextNodeId, error };
};
