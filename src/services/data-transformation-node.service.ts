import { DataTransformationNode, Prisma } from "@prisma/client";
import { prisma } from "../config";
import { DataTransformationRuleConfig, JsonConfig } from "../types";

export async function createDataTransformNodes(
  data: Prisma.DataTransformationNodeUncheckedCreateInput
): Promise<DataTransformationNode> {
  try {
    return await prisma.dataTransformationNode.create({ data });
  } catch (error) {
    console.error("ERROR: Failed to create data transform nodes", error);
    throw error;
  }
}

export async function getDataTransformNodeById(nodeId: string): Promise<DataTransformationNode> {
  try {
    const node = await prisma.dataTransformationNode.findUnique({ where: { node_id: nodeId } });
    if (!node) throw new Error("Data Transform node not found.");
    return node;
  } catch (error) {
    console.error("ERROR: Failed to fetch data transform node", error);
    throw error;
  }
}

export async function updateDataTransformRules(
  nodeId: string,
  rules: DataTransformationRuleConfig
): Promise<DataTransformationNode> {
  try {
    const node = await prisma.dataTransformationNode.update({
      where: { node_id: nodeId },
      data: { transform_rules: rules as JsonConfig },
    });
    return node;
  } catch (error) {
    console.error("ERROR: Failed to update data transform node", error);
    throw error;
  }
}
