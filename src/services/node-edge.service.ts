import { NodeEdge } from "@prisma/client";
import { prisma } from "../config";
import { CreateNodeEdgeRecord, NodeEdgesCondition, NodeType } from "../types";
import { getNodeById, updateNodeParent } from "./node.service";

export async function createNodeEdge(data: CreateNodeEdgeRecord, updateParentGroup: boolean = true): Promise<NodeEdge> {
  try {
    if (data.group_id) {
      const groupNode = await getNodeById(data.group_id);
      if (groupNode.type !== NodeType.LOOP) {
        throw new Error(`Invalid group assignment: group_id (${data.group_id}) must reference a LOOP node.`);
      }
    }
    await validateOutgoingEdge(data);
    await validateIncomingEdge(data);
    const nodeEdge = await prisma.nodeEdge.create({ data });
    if (updateParentGroup && data.group_id) {
      await updateNodeParent(data.target_node_id, data.group_id);
    }
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
      if (edge.group_id) await updateNodeParent(edge.target_node_id);
    }
  } catch (error) {
    console.error("ERROR: TO DELETE NODE EDGES BETWEEN SOURCE AND TARGET", error);
    throw error;
  }
}

export async function deleteNodeEdgeById(edgeId: string): Promise<NodeEdge> {
  try {
    const nodeEdge = await getNodeEdge(edgeId);
    await prisma.nodeEdge.delete({
      where: { id: edgeId },
    });
    nodeEdge.group_id && (await updateNodeParent(nodeEdge.target_node_id));
    return nodeEdge;
  } catch (error) {
    console.error("ERROR: TO DELETE NODE EDGE", error);
    throw error;
  }
}

async function validateIncomingEdge(data: CreateNodeEdgeRecord): Promise<void> {
  const targetNode = await getNodeById(data.target_node_id);

  const existingEdges = await prisma.nodeEdge.findMany({ where: { target_node_id: data.target_node_id } });
  if (targetNode.type !== NodeType.LOOP) {
    if (existingEdges.length > 0) {
      throw new Error(`Node ${data.target_node_id} already has an incoming edge — parallel edges not allowed.`);
    }
  } else {
    const hasDirectEdge = existingEdges.some((edge) => edge.group_id == null || edge.group_id !== data.target_node_id);

    if (hasDirectEdge && (!data.group_id || data.group_id !== data.target_node_id)) {
      throw new Error(
        `Loop node ${data.target_node_id} already has a direct incoming edge. Only subgraph edges allowed.`
      );
    }
  }
}

async function validateOutgoingEdge(data: CreateNodeEdgeRecord): Promise<void> {
  const sourceNode = await getNodeById(data.source_node_id);
  const existingEdges = await prisma.nodeEdge.findMany({
    where: { source_node_id: data.source_node_id },
  });

  if (sourceNode.type == NodeType.ACTION) {
    if (existingEdges.length > 0) {
      throw new Error(`Action node ${data.source_node_id} already has an outgoing edge — only one allowed.`);
    }
  } else if (sourceNode.type == NodeType.CONDITIONAL) {
    if (data.condition == NodeEdgesCondition.NONE)
      throw new Error(`Condition '${NodeEdgesCondition.NONE}' is not allowed when the source node is conditional.`);
    if (existingEdges.some((edge) => edge.condition === data.condition)) {
      throw new Error(
        `Conditional node ${data.source_node_id} already has an outgoing edge for condition '${data.condition}'.`
      );
    }
    if (existingEdges.length >= 2) {
      throw new Error(`${sourceNode.type} node ${data.source_node_id} already has maximum allowed outgoing edges (2).`);
    }
  } else if (sourceNode.type == NodeType.LOOP) {
    const isSubgraphEdge = data.group_id === sourceNode.id;
    if (
      existingEdges.some(
        (edge) =>
          edge.target_node_id === data.target_node_id &&
          ((isSubgraphEdge && edge.group_id === sourceNode.id) || (!isSubgraphEdge && !edge.group_id))
      )
    ) {
      throw new Error(
        `Loop node ${data.source_node_id} already has an outgoing edge to node ${data.target_node_id} in the same context.`
      );
    }

    // Max 2 edges (1 direct + 1 subgraph)
    const directEdges = existingEdges.filter((e) => !e.group_id);
    const subgraphEdges = existingEdges.filter((e) => e.group_id === sourceNode.id);
    if (!isSubgraphEdge && directEdges.length >= 1) {
      throw new Error(`Loop node ${data.source_node_id} already has a direct outgoing edge.`);
    }
    if (isSubgraphEdge && subgraphEdges.length >= 1) {
      throw new Error(`Loop node ${data.source_node_id} already has a subgraph outgoing edge.`);
    }
  }
}
