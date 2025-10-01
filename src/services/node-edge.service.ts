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

export async function getNextNodeId(
  currentNodeId: string,
  condition: NodeEdgesCondition,
  groupId?: string | null
): Promise<string | null> {
  try {
    const edge = await prisma.nodeEdge.findFirst({
      where: {
        source_node_id: currentNodeId,
        condition,
        group_id: groupId || null,
      },
    });
    return edge ? edge.target_node_id : null;
  } catch (error) {
    console.error("ERROR: TO CREATE NODE EDGE", error);
    throw error;
  }
}

export async function getNextNodeAfterLoop(loopNodeId: string): Promise<string | null> {
  try {
    const edges = await prisma.nodeEdge.findMany({
      where: {
        source_node_id: loopNodeId,
        condition: NodeEdgesCondition.NONE,
        group_id: null,
      },
    });

    return edges.length > 0 ? edges[0].target_node_id : null;
  } catch (error) {
    console.error("ERROR: TO FETCH NEXT NODE AFTER LOOP", error);
    throw error;
  }
}

export async function deleteNodeEdges(workflowId: string, sourceId: string, targetId: string): Promise<void> {
  try {
    await prisma.nodeEdge.deleteMany({
      where: { workflow_id: workflowId, source_node_id: sourceId, target_node_id: targetId },
    });
  } catch (error) {
    console.error("ERROR: TO DELETE NODE EDGES BETWEEN SOURCE AND TARGET", error);
    throw error;
  }
}

export async function deleteNodeEdgeById(edgeId: string): Promise<void> {
  try {
    await prisma.nodeEdge.delete({
      where: { id: edgeId },
    });
  } catch (error) {
    console.error("ERROR: TO DELETE NODE EDGE", error);
    throw error;
  }
}
