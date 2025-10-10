import { prisma } from "../config";
import { NODE_CATEGORY_MAPPER } from "../constants";
import { NodeType } from "../types";

export async function getCategoryIdByNodeType(type: NodeType): Promise<string | undefined> {
  try {
    const name = NODE_CATEGORY_MAPPER[type];
    const category = await prisma.nodeCategory.findUnique({ where: { name }, select: { id: true } });
    return category?.id;
  } catch (error) {
    console.error("ERROR: Failed to Fetch node category", error);
    throw error;
  }
}
