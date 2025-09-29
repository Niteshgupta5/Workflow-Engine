import { Node } from "@prisma/client";
import { ExecutionStatus } from "../../../types";

export async function handleLoopNode(
  node: Node,
  nodeLogId: string,
  context: Record<string, any>,
  prevNodeId: string | null = null
): Promise<{ status: ExecutionStatus; nextNodeId: string | null }> {
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
