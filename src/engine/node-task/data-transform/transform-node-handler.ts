import { Node } from "@prisma/client";
import { ExecutionStatus, TaskStatus, TransformationRuleMap, NodeEdgesCondition } from "../../../types";
import { getDataTransformNodeById, getNextNodeId, logTaskExecution, updateTaskLog } from "../../../services";
import { resolveTemplate } from "../../../utils";
import { transformationHandlers } from "./transformation-type-handler";

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const handleDataTransformNode = async (
  node: Node,
  nodeLogId: string,
  context: Record<string, any>,
  prevNodeId: string | null = null,
  groupId: string | null = null
): Promise<{ status: ExecutionStatus; nextNodeId: string | null; error?: Error }> => {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let error: Error | undefined;
  let result: any = null;

  const dataTransformNode = await getDataTransformNodeById(node.id);
  const taskLog = await logTaskExecution({
    node_log_id: nodeLogId,
    task_id: dataTransformNode.id,
    task_type: node.type,
    status: TaskStatus.RUNNING,
  });

  try {
    if (!dataTransformNode.transform_rules) {
      throw new Error("Transform rules do not exist");
    }

    const inputData = prevNodeId ? context?.output?.[prevNodeId]?.result : context.input || context.data || {};

    const transformRules = resolveTemplate(dataTransformNode.transform_rules, context);
    const typeKey = dataTransformNode.transformation_type as keyof TransformationRuleMap;
    const handler = transformationHandlers[typeKey];

    if (!handler) {
      throw new Error(`Unsupported transformation type: ${dataTransformNode.transformation_type}`);
    }

    result = await handler(inputData, transformRules, context);

    context.output ??= {};
    context.output[node.id] = {
      result,
      timestamp: new Date().toISOString(),
      transformationType: dataTransformNode.transformation_type,
    };

    await updateTaskLog(taskLog.id, {
      status: TaskStatus.COMPLETED,
      data: result,
      created_at: new Date(),
    });
  } catch (err) {
    nodeStatus = ExecutionStatus.FAILED;
    error = err instanceof Error ? err : new Error(String(err));

    await updateTaskLog(taskLog.id, {
      status: TaskStatus.FAILED,
      data: { error: String(error) },
      created_at: new Date(),
    });
  }

  const nextNodeId = await getNextNodeId(node.id, NodeEdgesCondition.NONE, groupId);
  return { status: nodeStatus, nextNodeId, error };
};
