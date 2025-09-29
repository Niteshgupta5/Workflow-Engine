import { Node } from "@prisma/client";
import { prisma } from "../config";
import { createNodeEdge } from "./node-edge.service";
import { createActionNodes } from "./action-node.service";
import { createConditionalNodes } from "./conditional-node.service";
import { CreateNodeRecord, NodeEdgesCondition, NodeEdgeType, NodeType } from "../types";

export async function createNode(data: CreateNodeRecord): Promise<Node> {
  try {
    const { parent_node_id, condition, actions, conditions, ...rest } = data;

    const parentNode = parent_node_id ? await getNodeById(parent_node_id) : null;

    if (data.type == NodeType.ACTION && !actions?.length) throw new Error("At least one action needed");
    if (data.type == NodeType.CONDITIONAL && !conditions?.length) throw new Error("At least one condition needed");

    // Create New Node
    const newNode = await prisma.node.create({ data: rest });

    // Create Action Nodes
    if (newNode.type == NodeType.ACTION && actions?.length) {
      const updatedActions = actions.map((item, i) => ({
        ...item,
        node_id: newNode.id,
        order: i + 1,
        params: item.params as any,
      }));
      await createActionNodes(updatedActions);
    } else if (newNode.type == NodeType.CONDITIONAL && conditions?.length) {
      // Create Conditional Nodes
      const updatedConditions = conditions.map((item, i) => ({
        ...item,
        node_id: newNode.id,
        order: i + 1,
      }));
      await createConditionalNodes(updatedConditions);
    }

    if (parentNode && parent_node_id) {
      await createNodeEdge({
        workflow_id: data.workflow_id,
        source_node_id: parent_node_id,
        target_node_id: newNode.id,
        condition: condition ?? NodeEdgesCondition.NONE,
        edge_type: parentNode.type === NodeType.CONDITIONAL ? NodeEdgeType.CONDITIONAL : NodeEdgeType.NORMAL,
      });
    }

    return newNode;
  } catch (error) {
    console.error("ERROR: TO CREATE NODE", error);
    throw error;
  }
}

export async function getNodeById(id: string): Promise<Node> {
  try {
    const node = await prisma.node.findUnique({ where: { id } });
    if (!node) throw Error("Error: Node Not Found");
    return node;
  } catch (error) {
    console.error("ERROR: TO GET NODE BY ID", error);
    throw error;
  }
}

export async function getEntryNode(workflowId: string): Promise<Node | null> {
  try {
    const data = await prisma.$queryRaw<Node[]>`
        SELECT *
        FROM "public".nodes
        WHERE workflow_id = ${workflowId}
        AND id NOT IN (
            SELECT target_node_id
            FROM "public".node_edges
            WHERE workflow_id = ${workflowId}
        )
      `;
    return data[0] ?? null;
  } catch (error) {
    console.error("ERROR: FAILED TO FETCH FIRST NODE OF WORKFLOW", error);
    throw error;
  }
}
