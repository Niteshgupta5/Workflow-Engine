import { NodeEdge } from "@prisma/client";
import { prisma } from "../config";
import { CreateNodeEdgeRecord, NodeEdgesCondition } from "../types";

export async function createNodeEdge(data: CreateNodeEdgeRecord): Promise<NodeEdge> {
  try {
    return await prisma.nodeEdge.create({ data });
  } catch (error) {
    console.error("ERROR: TO CREATE NODE EDGE", error);
    throw error;
  }
}

export async function getNextNodeId(currentNodeId: string, condition: NodeEdgesCondition): Promise<string | null> {
  try {
    const edge = await prisma.nodeEdge.findFirst({
      where: {
        source_node_id: currentNodeId,
        condition,
      },
    });
    return edge ? edge.target_node_id : null;
  } catch (error) {
    console.error("ERROR: TO CREATE NODE EDGE", error);
    throw error;
  }
}
