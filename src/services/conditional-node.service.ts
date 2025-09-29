import { ConditionalNode, Prisma } from "@prisma/client";
import { prisma } from "../config";

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
