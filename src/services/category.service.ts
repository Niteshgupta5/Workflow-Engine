import { NodeCategory } from "@prisma/client";
import { prisma } from "../config";
import { NODE_CATEGORY_MAPPER } from "../constants";
import { NodeCategoryWithTemplatesDTO, NodeType } from "../types";

export async function getCategoryByNodeType(type: NodeType): Promise<NodeCategory> {
  try {
    const name = NODE_CATEGORY_MAPPER[type];
    const category = await prisma.nodeCategory.findUnique({ where: { name } });
    if (!category) throw new Error(`Category Not Found`);
    return category;
  } catch (error) {
    console.error("ERROR: Failed to Fetch node category", error);
    throw error;
  }
}

export async function getAllCategoriesWithTemplates(): Promise<NodeCategoryWithTemplatesDTO[]> {
  try {
    const categories = await prisma.nodeCategory.findMany({
      select: { id: true, name: true, description: true, created_at: true, updated_at: true, NodeTemplate: true },
    });
    return categories;
  } catch (error) {
    console.error("ERROR: Failed to Fetch all node categories", error);
    throw error;
  }
}
