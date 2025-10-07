import { LoopConfiguration, Node } from "@prisma/client";
import { ExecutionStatus, LoopType, NodeEdgesCondition } from "../../../types";
import { getLoopConfig, getNextNodeAfterLoop, getNextNodeId } from "../../../services";
import { evaluateCondition, resolveTemplate } from "../../../utils";
import { executeSubgraph } from "./subgraph.executor";

export async function handleLoopNode(
  node: Node,
  executionId: string,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  prevNodeId: string | null = null
): Promise<{ status: ExecutionStatus; nextNodeId: string | null }> {
  const loopConfigs = await getLoopConfig(node.id);
  let nodeStatus = ExecutionStatus.COMPLETED;
  console.log("=====Loop Start=====");

  if (!loopConfigs) {
    console.error("No loop configuration found for loop node:", node.id);
    return { status: ExecutionStatus.FAILED, nextNodeId: null };
  }

  switch (loopConfigs.loop_type) {
    case LoopType.FIXED:
      nodeStatus = await handleFixedLoop(node, loopConfigs, context, executionContext, executionId);
      break;
    case LoopType.FOR_EACH:
      nodeStatus = await handleForEachLoop(node, loopConfigs, context, executionContext, executionId);
      break;
    case LoopType.WHILE:
      nodeStatus = await handleConditionalLoop(node, loopConfigs, context, executionContext, executionId);
      break;
    default:
      console.error("Unknown loop type:", loopConfigs.loop_type);
      return { status: ExecutionStatus.FAILED, nextNodeId: null };
  }
  console.log("=====Loop End=====");

  const nextNodeId = await getNextNodeAfterLoop(node.id);

  return { status: nodeStatus, nextNodeId };
}

async function handleFixedLoop(
  loopNode: Node,
  configs: LoopConfiguration,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  executionId: string
): Promise<ExecutionStatus> {
  if (!configs?.max_iterations) return ExecutionStatus.FAILED;
  let nodeStatus = ExecutionStatus.COMPLETED;

  for (let i = 0; i < configs.max_iterations; i++) {
    const nextNodeId = await getNextNodeId(loopNode.id, NodeEdgesCondition.NONE, loopNode.id);
    if (!nextNodeId) {
      console.warn(`Loop [${loopNode.id}] stopped early at iteration ${i + 1}, no next node.`);
      break;
    }
    if (nextNodeId === loopNode.id) {
      console.warn(`Loop [${loopNode.id}] has next node as itself, stopping to avoid infinite loop.`);
      continue;
    }

    await executeSubgraph(loopNode, context, executionContext, executionId, nodeStatus, nextNodeId, i + 1);
  }

  return nodeStatus;
}

async function handleConditionalLoop(
  loopNode: Node,
  configs: LoopConfiguration,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  executionId: string
): Promise<ExecutionStatus> {
  if (!configs?.exit_condition) return ExecutionStatus.FAILED;

  let iteration = 0;
  let conditionMet = true;
  let nodeStatus = ExecutionStatus.COMPLETED;

  while (conditionMet) {
    const exit = evaluateCondition(configs.exit_condition, context);
    if (exit.status) {
      console.log(`Loop [${loopNode.id}] exited at iteration ${iteration}`);
      break;
    }

    const nextNodeId = await getNextNodeId(loopNode.id, NodeEdgesCondition.NONE, loopNode.id);
    if (!nextNodeId) {
      console.warn(`Loop [${loopNode.id}] stopped early at iteration ${iteration + 1}, no next node.`);
      break;
    }
    if (nextNodeId === loopNode.id) {
      console.warn(`Loop [${loopNode.id}] has next node as itself, stopping to avoid infinite loop.`);
      continue;
    }

    await executeSubgraph(loopNode, context, executionContext, executionId, nodeStatus, nextNodeId, iteration + 1);
    iteration++;
  }

  return nodeStatus;
}

async function handleForEachLoop(
  loopNode: Node,
  configs: LoopConfiguration,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  executionId: string
): Promise<ExecutionStatus> {
  if (!configs?.data_source_path) return ExecutionStatus.FAILED;

  let nodeStatus = ExecutionStatus.COMPLETED;
  const items = resolveTemplate(configs.data_source_path, context);
  if (!Array.isArray(items)) {
    console.error(`Loop [${loopNode.id}] expected array at ${configs.data_source_path}, got:`, items);
    return ExecutionStatus.FAILED;
  }

  for (let i = 0; i < items.length; i++) {
    // context["$item"] = items[i]; // inject current item into context
    context["$index"] = i;

    const nextNodeId = await getNextNodeId(loopNode.id, NodeEdgesCondition.NONE, loopNode.id);
    if (!nextNodeId) {
      console.warn(`Loop [${loopNode.id}] stopped at index ${i + 1}, no next node.`);
      break;
    }

    if (nextNodeId === loopNode.id) {
      console.warn(`Loop [${loopNode.id}] points to itself. Stopping to avoid infinite loop.`);
      continue;
    }
    await executeSubgraph(loopNode, context, executionContext, executionId, nodeStatus, nextNodeId, i + 1);
  }

  return nodeStatus;
}
