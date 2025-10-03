import { ConditionalNode, Prisma } from "@prisma/client";
import { prisma } from "../config";
import { UpdateConditionalNodeRecord } from "../types";

export async function createConditionalNodes(
  data: Prisma.ConditionalNodeCreateManyInput[]
): Promise<{ count: number }> {
  try {
    return await prisma.conditionalNode.createMany({ data });
  } catch (error) {
    console.error("ERROR: Failed to create conditional nodes", error);
    throw error;
  }
}

export async function getNodeConditions(nodeId: string): Promise<ConditionalNode[]> {
  try {
    return await prisma.conditionalNode.findMany({
      where: { node_id: nodeId },
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("ERROR: Failed to Fetch conditional nodes", error);
    throw error;
  }
}

export async function upsertManyConditionsNodes(
  nodeId: string,
  conditions: UpdateConditionalNodeRecord[]
): Promise<void> {
  try {
    if (!conditions?.length) return;
    const updatedConditionIds = conditions.map((a) => a.id).filter(Boolean);
    await prisma.conditionalNode.deleteMany({
      where: { node_id: nodeId, id: { notIn: updatedConditionIds } },
    });

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      await prisma.conditionalNode.upsert({
        where: { id: condition.id || "" },
        update: {
          expression: condition.expression,
          order: i + 1,
        },
        create: {
          node_id: nodeId,
          expression: condition.expression,
          order: i + 1,
        },
      });
    }
  } catch (error) {
    console.error("ERROR: TO UPSERT MANY CONDITIONAL NODES", error);
    throw error;
  }
}
