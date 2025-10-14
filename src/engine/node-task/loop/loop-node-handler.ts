import { Node } from "@prisma/client";
import { ExecutionResult, ExecutionStatus, LoopConfig, LoopType, NodeEdgesCondition } from "../../../types";
import { getNextNodeAfterLoop, getNextNodeId } from "../../../services";
import { evaluateCondition, resolveTemplate } from "../../../utils";
import { executeSubgraph } from "./subgraph.executor";

export async function handleLoopNode(
  node: Node,
  executionId: string,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  prevNodeId: string | null = null
): Promise<ExecutionResult> {
  let nodeStatus = ExecutionStatus.COMPLETED;
  let error: Error | undefined = undefined;
  console.log("=====Loop Start=====");

  try {
    const loopConfigs = node.config as unknown as LoopConfig;
    if (!loopConfigs || !loopConfigs.loop_type) {
      throw new Error(`No loop configuration found for loop node: ${node.name}`);
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
  } catch (err) {
    error = err as Error;
    nodeStatus = ExecutionStatus.FAILED;
  }

  const nextNodeId = await getNextNodeAfterLoop(node.id);
  return { status: nodeStatus, nextNodeId, error };
}

async function handleFixedLoop(
  loopNode: Node,
  configs: LoopConfig,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  executionId: string
): Promise<ExecutionStatus> {
  if (!configs?.max_iterations)
    throw new Error(`max_iteration config not found for Fixed loop type in ${loopNode.name} node`);
  let nodeStatus = ExecutionStatus.COMPLETED;

  for (let i = 0; i < configs.max_iterations; i++) {
    const nextNodeId = await getNextNodeId(loopNode.id, NodeEdgesCondition.NONE, loopNode.id);
    if (!nextNodeId) {
      console.warn(`Loop [${loopNode.name}] stopped early at iteration ${i + 1}, no next node.`);
      break;
    }
    if (nextNodeId === loopNode.id) {
      console.warn(`Loop [${loopNode.name}] has next node as itself, stopping to avoid infinite loop.`);
      continue;
    }
    await executeSubgraph(loopNode, context, executionContext, executionId, nodeStatus, nextNodeId, i + 1);
  }

  return nodeStatus;
}

async function handleConditionalLoop(
  loopNode: Node,
  configs: LoopConfig,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  executionId: string
): Promise<ExecutionStatus> {
  if (!configs?.exit_condition)
    throw new Error(`exit_condition config not found for Conditional loop type in ${loopNode.name} node`);

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
      console.warn(`Loop [${loopNode.name}] stopped early at iteration ${iteration + 1}, no next node.`);
      break;
    }
    if (nextNodeId === loopNode.id) {
      console.warn(`Loop [${loopNode.name}] has next node as itself, stopping to avoid infinite loop.`);
      continue;
    }

    await executeSubgraph(loopNode, context, executionContext, executionId, nodeStatus, nextNodeId, iteration + 1);
    iteration++;
  }

  return nodeStatus;
}

async function handleForEachLoop(
  loopNode: Node,
  configs: LoopConfig,
  context: Record<string, any>,
  executionContext: Record<string, any>,
  executionId: string
): Promise<ExecutionStatus> {
  if (!configs?.data_source_path)
    throw new Error(`data_source_path config not found for Conditional loop type in ${loopNode.name} node`);

  let nodeStatus = ExecutionStatus.COMPLETED;
  const items = resolveTemplate(configs.data_source_path, context);
  if (!Array.isArray(items)) {
    throw new Error(`Loop [${loopNode.name}] expected array at ${configs.data_source_path}, got:`, items);
  }

  for (let i = 0; i < items.length; i++) {
    // context["$item"] = items[i]; // inject current item into context
    context["$index"] = i;

    const nextNodeId = await getNextNodeId(loopNode.id, NodeEdgesCondition.NONE, loopNode.id);
    if (!nextNodeId) {
      console.warn(`Loop [${loopNode.name}] stopped at index ${i + 1}, no next node.`);
      break;
    }

    if (nextNodeId === loopNode.id) {
      console.warn(`Loop [${loopNode.name}] points to itself. Stopping to avoid infinite loop.`);
      continue;
    }
    await executeSubgraph(loopNode, context, executionContext, executionId, nodeStatus, nextNodeId, i + 1);
  }

  return nodeStatus;
}
