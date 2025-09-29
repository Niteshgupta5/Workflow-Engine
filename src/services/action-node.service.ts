import { ActionNode, Prisma } from "@prisma/client";
import { prisma } from "../config";

export async function createActionNodes(data: Prisma.ActionNodeCreateManyInput[]): Promise<{ count: number }> {
  try {
    return await prisma.actionNode.createMany({ data });
  } catch (error) {
    console.error("ERROR: Failed to create action nodes", error);
    throw error;
  }
}

export async function getNodeActions(nodeId: string): Promise<ActionNode[]> {
  try {
    return await prisma.actionNode.findMany({
      where: { node_id: nodeId },
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("ERROR: Failed to Fetch action nodes", error);
    throw error;
  }
}
