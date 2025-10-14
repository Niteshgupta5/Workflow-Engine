import { prisma } from "../config";
import { NodeType } from "../types";

export async function getTemplateIdByNodeType(type: NodeType): Promise<string> {
  try {
    const template = await prisma.nodeTemplate.findFirst({ where: { type }, select: { id: true } });
    if (!template) throw new Error(`Node Template Not Found`);
    return template.id;
  } catch (error) {
    console.error("ERROR: Failed to fetch node template", error);
    throw error;
  }
}
