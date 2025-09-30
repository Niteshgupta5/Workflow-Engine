import { LoopConfiguration, Node } from "@prisma/client";
import { ExecutionStatus, LoopType, NodeEdgesCondition } from "../../../types";
import { getLoopConfig, getNextNodeId, getNodeById } from "../../../services";
import { runNode } from "../../node-runner";

export async function handleLoopNode(
  node: Node,
  nodeLogId: string,
  executionId: string,
  context: Record<string, any>,
  prevNodeId: string | null = null
): Promise<{ status: ExecutionStatus; nextNodeId: string | null }> {
  const loopConfigs = await getLoopConfig(node.id);
  if (!loopConfigs) {
    console.error("No loop configuration found for loop node:", node.id);
    return { status: ExecutionStatus.FAILED, nextNodeId: null };
  }

  switch (loopConfigs.loop_type) {
    case LoopType.FIXED:
      await handleFixedLoop(loopConfigs, node, context, executionId);
      break;
    case LoopType.FOR_EACH:
      await handleForEachLoop(loopConfigs, node, context);
      break;
    case LoopType.WHILE:
      await handleConditionalLoop(loopConfigs, node);
      break;
    default:
      console.error("Unknown loop type:", loopConfigs.loop_type);
      return { status: ExecutionStatus.FAILED, nextNodeId: null };
  }

  //   const iterable = resolveExpression(node.config.iterator, context);
  //   if (!Array.isArray(iterable)) throw new Error("Loop iterator must resolve to array");
  //   for (let i = 0; i < iterable.length; i++) {
  //     const loopCtx = {
  //       ...context,
  //       loop: { index: i, value: iterable[i] },
  //       [node.config.loop_variable]: iterable[i],
  //     };
  //     await runChildNodes(node.id, loopCtx);
  //     if (node.config.condition) {
  //       const shouldContinue = evaluateCondition(node.config.condition, loopCtx);
  //       if (!shouldContinue) break;
  //     }
  //   }
  //   return context;

  return { status: ExecutionStatus.COMPLETED, nextNodeId: null };
}

async function handleFixedLoop(
  configs: LoopConfiguration,
  loopNode: Node,
  context: Record<string, any>,
  executionId: string
) {
  if (!configs?.max_iterations) return;
  let currentNodeId: string | null = loopNode.id;
  for (let i = 0; i < configs.max_iterations; i++) {
    const nextNodeId = await getNextNodeId(currentNodeId, NodeEdgesCondition.NONE, loopNode.id);
    console.log("=====>iteration", i, nextNodeId);
    if (!nextNodeId) {
      console.warn(`Loop [${loopNode.id}] stopped early at iteration ${i + 1}, no next node.`);
      break;
    }
    if (nextNodeId === loopNode.id) {
      console.warn(`Loop [${loopNode.id}] has next node as itself, stopping to avoid infinite loop.`);
      continue;
    }
    const nextNode = await getNodeById(nextNodeId);
    const result = await runNode(executionId, nextNode, context, currentNodeId);
    currentNodeId = nextNodeId;
  }
}

async function handleConditionalLoop(configs: LoopConfiguration, loopNode: Node) {
  if (!configs?.exit_condition) return;
  let conditionMet = false;
  while (!conditionMet) {}
}

async function handleForEachLoop(configs: LoopConfiguration, loopNode: Node, context: Record<string, any>) {
  if (!configs?.data_source_path) return;
  // const dataSource = resolveDataPath(configs.data_source_path, context);
  // if (!Array.isArray(dataSource)) throw new Error("Data source must resolve to an array");
  // for (const item of dataSource) {
  //   const loopContext = { ...context, loop_item: item };
  // }
}
