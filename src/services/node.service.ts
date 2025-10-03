import { Node } from "@prisma/client";
import { prisma } from "../config";
import { createNodeEdge, deleteNodeEdges } from "./node-edge.service";
import { createActionNodes } from "./action-node.service";
import { createConditionalNodes } from "./conditional-node.service";
import { CreateNodeRecord, NodeEdgesCondition, NodeType } from "../types";
import { createLoopConfig } from "./loop-config.service";
import { START_NODE_ID } from "../utils";

export async function createNode(data: CreateNodeRecord): Promise<Node> {
  try {
    const { workflow_id, type, name, ...rest } = data;

    const prevNode =
      rest.prev_node_id && rest.prev_node_id !== START_NODE_ID ? await getNodeById(rest.prev_node_id) : null;

    await checkNodeValidations(data, prevNode);

    // Create New Node
    const newNode = await prisma.node.create({
      data: { workflow_id, type, name, parent_id: rest.group_id || undefined },
    });

    // Handle child tables (actions, conditions, loop config)
    if (newNode.type == NodeType.ACTION && rest.actions?.length) {
      const updatedActions = rest.actions.map((item, i) => ({
        ...item,
        node_id: newNode.id,
        order: i + 1,
        params: item.params as any,
      }));
      await createActionNodes(updatedActions);
    } else if (newNode.type == NodeType.CONDITIONAL && rest.conditions?.length) {
      const updatedConditions = rest.conditions.map((item, i) => ({
        ...item,
        node_id: newNode.id,
        order: i + 1,
      }));
      await createConditionalNodes(updatedConditions);
    } else if (newNode.type == NodeType.LOOP && rest.loop_configuration) {
      await createLoopConfig({
        node_id: newNode.id,
        loop_type: rest.loop_configuration.loop_type,
        max_iterations: rest.loop_configuration.max_iterations ?? null,
        exit_condition: rest.loop_configuration.exit_condition ?? undefined,
        data_source_path: rest.loop_configuration.data_source_path ?? undefined,
      });

      await createNodeEdge({
        workflow_id,
        source_node_id: newNode.id,
        target_node_id: newNode.id,
        condition: NodeEdgesCondition.NONE,
        group_id: newNode.id,
      });
    }

    // Edge Handling
    if (prevNode && rest.prev_node_id && rest.prev_node_id !== START_NODE_ID) {
      if (rest.next_node_id) {
        // For In Between Node
        await deleteNodeEdges(workflow_id, rest.prev_node_id, rest.next_node_id);

        await createNodeEdge({
          workflow_id,
          source_node_id: rest.prev_node_id,
          target_node_id: newNode.id,
          condition: rest.condition ?? NodeEdgesCondition.NONE,
          group_id: rest.group_id || undefined,
        });

        await createNodeEdge({
          workflow_id,
          source_node_id: newNode.id,
          target_node_id: rest.next_node_id,
          condition: newNode.type === NodeType.CONDITIONAL ? NodeEdgesCondition.ON_TRUE : NodeEdgesCondition.NONE,
          group_id: rest.group_id || undefined,
        });
      } else {
        // For Last Node
        await createNodeEdge({
          workflow_id,
          source_node_id: rest.prev_node_id,
          target_node_id: newNode.id,
          condition: rest.condition ?? NodeEdgesCondition.NONE,
          group_id: rest.group_id || undefined,
        });
      }
    } else if (rest.prev_node_id === START_NODE_ID && rest.next_node_id) {
      // For Beginning Node
      await createNodeEdge({
        workflow_id,
        source_node_id: newNode.id,
        target_node_id: rest.next_node_id,
        condition: newNode.type === NodeType.CONDITIONAL ? NodeEdgesCondition.ON_TRUE : NodeEdgesCondition.NONE,
        group_id: rest.group_id || undefined,
      });
    }

    return newNode;
  } catch (error) {
    console.error("ERROR: TO CREATE NODE", error);
    throw error;
  }
}

async function checkNodeValidations(data: CreateNodeRecord, prevNode: Node | null) {
  if (data.type == NodeType.ACTION && !data.actions?.length) throw new Error("At least one action needed");
  if (data.type == NodeType.CONDITIONAL && !data.conditions?.length) throw new Error("At least one condition needed");
  if (prevNode?.type == NodeType.CONDITIONAL && data.condition == NodeEdgesCondition.NONE) {
    throw new Error(
      `Condition must be ('${NodeEdgesCondition.ON_TRUE}' or '${NodeEdgesCondition.ON_FALSE}') for Conditional parent node`
    );
  }
  if (prevNode?.type != NodeType.CONDITIONAL && data.condition && data.condition != NodeEdgesCondition.NONE) {
    throw new Error(`Condition must be '${NodeEdgesCondition.NONE}' for non-Conditional parent node`);
  }
  if (data.type == NodeType.LOOP && !data.loop_configuration)
    throw new Error("Loop Configuration is required for Loop Node");
  if (data.type != NodeType.LOOP && data.loop_configuration)
    throw new Error("Loop Configuration is only for Loop Node");
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
