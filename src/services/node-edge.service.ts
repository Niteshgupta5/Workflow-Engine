import { NodeEdge } from "@prisma/client";
import { prisma } from "../config";
import { CreateNodeEdgeRecord, NodeEdgesCondition } from "../types";
import { updateNodeParent } from "./node.service";

export async function createNodeEdge(data: CreateNodeEdgeRecord, updateParentGroup: boolean = true): Promise<NodeEdge> {
  try {
    const nodeEdge = await prisma.nodeEdge.create({ data });
    updateParentGroup && data.group_id && (await updateNodeParent(data.target_node_id, data.group_id));
    return nodeEdge;
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

export async function getNodeEdge(id: string): Promise<NodeEdge> {
  try {
    const nodeEdge = await prisma.nodeEdge.findUnique({ where: { id } });
    if (!nodeEdge) throw new Error("Edge Not Found");
    return nodeEdge;
  } catch (error) {
    console.error("ERROR: TO GET NODE EDGE", error);
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
    const nodeEdges = await prisma.nodeEdge.findMany({
      where: { workflow_id: workflowId, source_node_id: sourceId, target_node_id: targetId },
    });

    if (!nodeEdges.length) return;
    await prisma.nodeEdge.deleteMany({
      where: { workflow_id: workflowId, source_node_id: sourceId, target_node_id: targetId },
    });

    for (const edge of nodeEdges) {
      edge.group_id && (await updateNodeParent(edge.target_node_id));
    }
  } catch (error) {
    console.error("ERROR: TO DELETE NODE EDGES BETWEEN SOURCE AND TARGET", error);
    throw error;
  }
}

export async function deleteNodeEdgeById(edgeId: string): Promise<void> {
  try {
    const nodeEdge = await getNodeEdge(edgeId);
    await prisma.nodeEdge.delete({
      where: { id: edgeId },
    });
    nodeEdge.group_id && (await updateNodeParent(nodeEdge.target_node_id));
  } catch (error) {
    console.error("ERROR: TO DELETE NODE EDGE", error);
    throw error;
  }
}
