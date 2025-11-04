import { Node, Edge } from "@prisma/client";
import { prisma } from "../config";
import {
  CreateNodeEdgeRecord,
  NodeEdgesCondition,
  NodeType,
  SwitchCaseCondition,
  SwitchConfig,
  UpdateNodeEdgeRecord,
} from "../types";
import { getNodeById, updateNodeParent } from "./node.service";

export async function createNodeEdge(data: CreateNodeEdgeRecord, updateParentGroup: boolean = true): Promise<Edge> {
  try {
    if (data.group_id) {
      const groupNode = await getNodeById(data.group_id, data.workflow_id);
      if (groupNode.type !== NodeType.LOOP) {
        throw new Error(`Invalid group assignment: group_id (${data.group_id}) must reference a LOOP node.`);
      }
    }
    await validateOutgoingEdge(data);
    await validateIncomingEdge(data);
    const nodeEdge = await prisma.edge.create({ data });
    if (updateParentGroup && data.group_id) {
      await updateNodeParent(data.target, data.group_id);
    }
    return nodeEdge;
  } catch (error) {
    console.error("ERROR: TO CREATE NODE EDGE", error);
    throw error;
  }
}

export async function getNextNodeId(
  currentNodeId: string,
  condition: NodeEdgesCondition | SwitchCaseCondition,
  groupId?: string | null
): Promise<string | null> {
  try {
    const edge = await prisma.edge.findFirst({
      where: {
        source: currentNodeId,
        condition,
        group_id: groupId || null,
      },
    });
    return edge ? edge.target : null;
  } catch (error) {
    console.error("ERROR: TO CREATE NODE EDGE", error);
    throw error;
  }
}

export async function getAllOutgoingEdgesForSwitchNode(nodeId: string): Promise<Edge[]> {
  try {
    const outgoingEdges = await prisma.edge.findMany({
      where: { source: nodeId, sourceNode: { type: NodeType.SWITCH } },
      orderBy: { condition: "asc" },
    });
    return outgoingEdges;
  } catch (error) {
    console.error("ERROR: TO FETCH ALL OUTGOING NODE EDGES", error);
    throw error;
  }
}

export async function updateNodeEdge(edgeId: string, data: UpdateNodeEdgeRecord): Promise<Edge> {
  try {
    return await prisma.edge.update({ where: { id: edgeId }, data });
  } catch (error) {
    console.error("ERROR: TO UPDATE NODE EDGE", error);
    throw error;
  }
}

export async function updateSwitchCaseExpressions(nodeId: string, switchCases: SwitchConfig[]) {
  try {
    if (!switchCases.length) return;
    const outgoingEdges = await getAllOutgoingEdgesForSwitchNode(nodeId);
    for (const edge of outgoingEdges) {
      const matchingCase = switchCases.find((c) => c.condition === edge.condition);

      if (matchingCase) {
        await updateNodeEdge(edge.id, { expression: matchingCase.expression });
      } else {
        await deleteNodeEdgeById(edge.id);
      }
    }
  } catch (error) {
    console.error("ERROR: TO UPDATE NODE EDGE", error);
    throw error;
  }
}

export async function getNodeEdge(id: string): Promise<Edge> {
  try {
    const nodeEdge = await prisma.edge.findUnique({ where: { id } });
    if (!nodeEdge) throw new Error("Edge Not Found");
    return nodeEdge;
  } catch (error) {
    console.error("ERROR: TO GET NODE EDGE", error);
    throw error;
  }
}

export async function getNextNodeAfterLoop(loopNodeId: string): Promise<string | null> {
  try {
    const edges = await prisma.edge.findMany({
      where: {
        source: loopNodeId,
        condition: NodeEdgesCondition.NONE,
        group_id: null,
      },
    });

    return edges.length > 0 ? edges[0].target : null;
  } catch (error) {
    console.error("ERROR: TO FETCH NEXT NODE AFTER LOOP", error);
    throw error;
  }
}

export async function validateSwitchCaseEdgeDuplication(
  prevNode: Node,
  condition: NodeEdgesCondition | SwitchCaseCondition
): Promise<void> {
  const outgoingEdges = await getAllOutgoingEdgesForSwitchNode(prevNode.id);
  const hasEdge = outgoingEdges.some((e) => e.condition == condition);
  if (hasEdge) throw new Error(`Switch node already has an edge for the case '${condition}'`);
  return;
}

export async function deleteNodeEdges(workflowId: string, sourceId: string, targetId: string): Promise<Edge[]> {
  try {
    const nodeEdges = await prisma.edge.findMany({
      where: { workflow_id: workflowId, source: sourceId, target: targetId },
    });

    if (!nodeEdges.length) return [];
    await prisma.edge.deleteMany({
      where: { workflow_id: workflowId, source: sourceId, target: targetId },
    });

    for (const edge of nodeEdges) {
      if (edge.group_id) await updateNodeParent(edge.target);
    }
    return nodeEdges;
  } catch (error) {
    console.error("ERROR: TO DELETE NODE EDGES BETWEEN SOURCE AND TARGET", error);
    throw error;
  }
}

export async function deleteNodeEdgeById(edgeId: string): Promise<Edge> {
  try {
    const nodeEdge = await getNodeEdge(edgeId);
    await prisma.edge.delete({
      where: { id: edgeId },
    });
    nodeEdge.group_id && (await updateNodeParent(nodeEdge.target));
    return nodeEdge;
  } catch (error) {
    console.error("ERROR: TO DELETE NODE EDGE", error);
    throw error;
  }
}

async function validateIncomingEdge(data: CreateNodeEdgeRecord): Promise<void> {
  const targetNode = await getNodeById(data.target, data.workflow_id);

  const existingEdges = await prisma.edge.findMany({ where: { target: data.target } });
  if (targetNode.type !== NodeType.LOOP) {
    if (existingEdges.length > 0) {
      throw new Error(`Node ${data.target} already has an incoming edge — parallel edges not allowed.`);
    }
  } else {
    const hasDirectEdge = existingEdges.some((edge) => edge.group_id == null || edge.group_id !== data.target);

    if (hasDirectEdge && (!data.group_id || data.group_id !== data.target)) {
      throw new Error(`Loop node ${data.target} already has a direct incoming edge. Only subgraph edges allowed.`);
    }
  }
}

async function validateOutgoingEdge(data: CreateNodeEdgeRecord): Promise<void> {
  const sourceNode = await getNodeById(data.source, data.workflow_id);
  const existingEdges = await prisma.edge.findMany({
    where: { source: data.source },
  });

  if (
    ![NodeType.CONDITIONAL, NodeType.LOOP, NodeType.SWITCH, NodeType.RULE_EXECUTOR].includes(
      sourceNode.type as NodeType
    )
  ) {
    if (existingEdges.length > 0) {
      throw new Error(`Action node ${data.source} already has an outgoing edge — only one allowed.`);
    }
  } else if ([NodeType.CONDITIONAL, NodeType.RULE_EXECUTOR].includes(sourceNode.type as NodeType)) {
    if (data.condition == NodeEdgesCondition.NONE)
      throw new Error(`Condition '${NodeEdgesCondition.NONE}' is not allowed when the source node is conditional.`);
    if (existingEdges.some((edge) => edge.condition === data.condition)) {
      throw new Error(
        `${sourceNode.type} node ${data.source} already has an outgoing edge for condition '${data.condition}'.`
      );
    }
    if (existingEdges.length >= 2) {
      throw new Error(`${sourceNode.type} node ${data.source} already has maximum allowed outgoing edges (2).`);
    }
  } else if (sourceNode.type == NodeType.LOOP) {
    const isSubgraphEdge = data.group_id === sourceNode.id;
    if (
      existingEdges.some(
        (edge) =>
          edge.target === data.target &&
          ((isSubgraphEdge && edge.group_id === sourceNode.id) || (!isSubgraphEdge && !edge.group_id))
      )
    ) {
      throw new Error(
        `Loop node ${data.source} already has an outgoing edge to node ${data.target} in the same context.`
      );
    }

    // Max 2 edges (1 direct + 1 subgraph)
    const directEdges = existingEdges.filter((e) => !e.group_id);
    const subgraphEdges = existingEdges.filter((e) => e.group_id === sourceNode.id);
    if (!isSubgraphEdge && directEdges.length >= 1) {
      throw new Error(`Loop node ${data.source} already has a direct outgoing edge.`);
    }
    if (isSubgraphEdge && subgraphEdges.length >= 1) {
      throw new Error(`Loop node ${data.source} already has a subgraph outgoing edge.`);
    }
  } else if (sourceNode.type == NodeType.SWITCH) {
    await validateSwitchCaseEdgeDuplication(sourceNode, data.condition);
  }
}
