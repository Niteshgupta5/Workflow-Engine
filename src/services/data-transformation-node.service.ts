import { Prisma } from "@prisma/client";
import { prisma } from "../config";

export async function createDataTransformNodes(
  data: Prisma.DataTransformationNodeUncheckedCreateInput
): Promise<{ count: number }> {
  try {
    return await prisma.dataTransformationNode.createMany({ data });
  } catch (error) {
    console.error("ERROR: Failed to create action nodes", error);
    throw error;
  }
}
