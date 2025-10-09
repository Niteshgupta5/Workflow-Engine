import { Node, Prisma } from "@prisma/client";
import { prisma } from "../config";
import { createNodeEdge, deleteNodeEdges } from "./node-edge.service";
import { createActionNodes, upsertManyActionNodes } from "./action-node.service";
import { createConditionalNodes, upsertManyConditionsNodes } from "./conditional-node.service";
import {
  CreateNodeRecord,
  GetNodeEdgeWithRelation,
  NodeEdgesCondition,
  NodeType,
  UpdateNodeRecord,
} from "../types";
import { createNodeConfig, updateNodeConfig } from "./node-config.service";
import { patterns, START_NODE_ID } from "../constants";

export async function createNode(data: CreateNodeRecord): Promise<Node> {
  try {
    const { workflow_id, type, name, ...rest } = data;

    const prevNode =
      rest.prev_node_id && rest.prev_node_id !== START_NODE_ID
        ? await getNodeById(rest.prev_node_id)
        : null;

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
    } else if (newNode.type == NodeType.LOOP && rest.configuration?.loop_configuration) {
      const config = rest.configuration?.loop_configuration;
      await createNodeConfig({
        node_id: newNode.id,
        loop_type: config.loop_type,
        max_iterations: config.max_iterations ?? null,
        exit_condition: config.exit_condition ?? undefined,
        data_source_path: config.data_source_path ?? undefined,
      });

      await createNodeEdge(
        {
          workflow_id,
          source_node_id: newNode.id,
          target_node_id: newNode.id,
          condition: NodeEdgesCondition.NONE,
          group_id: newNode.id,
        },
        false
      );
    } else if (newNode.type == NodeType.SWITCH && rest.configuration?.switch_cases) {
    }

    // Edge Handling
    if (prevNode && rest.prev_node_id && rest.prev_node_id !== START_NODE_ID) {
      if (rest.next_node_id) {
        // For In Between Node
        await deleteNodeEdges(workflow_id, rest.prev_node_id, rest.next_node_id);

        await createNodeEdge(
          {
            workflow_id,
            source_node_id: rest.prev_node_id,
            target_node_id: newNode.id,
            condition: rest.condition ?? NodeEdgesCondition.NONE,
            group_id: rest.group_id || undefined,
          },
          false
        );

        await createNodeEdge({
          workflow_id,
          source_node_id: newNode.id,
          target_node_id: rest.next_node_id,
          condition:
            newNode.type === NodeType.CONDITIONAL
              ? NodeEdgesCondition.ON_TRUE
              : newNode.type === NodeType.SWITCH
              ? "case_1"
              : NodeEdgesCondition.NONE,
          group_id: rest.group_id || undefined,
        });
      } else {
        // For Last Node
        await createNodeEdge(
          {
            workflow_id,
            source_node_id: rest.prev_node_id,
            target_node_id: newNode.id,
            condition: rest.condition ?? NodeEdgesCondition.NONE,
            group_id: rest.group_id || undefined,
          },
          false
        );
      }
    } else if (rest.prev_node_id === START_NODE_ID && rest.next_node_id) {
      // For Beginning Node
      await createNodeEdge(
        {
          workflow_id,
          source_node_id: newNode.id,
          target_node_id: rest.next_node_id,
          condition:
            newNode.type === NodeType.CONDITIONAL
              ? NodeEdgesCondition.ON_TRUE
              : newNode.type === NodeType.SWITCH
              ? "case_1"
              : NodeEdgesCondition.NONE,
          group_id: rest.group_id || undefined,
        },
        false
      );
    }

    return newNode;
  } catch (error) {
    console.error("ERROR: TO CREATE NODE", error);
    throw error;
  }
}

async function checkNodeValidations(data: CreateNodeRecord, prevNode: Node | null): Promise<void> {
  if (data.type == NodeType.ACTION && !data.actions?.length)
    throw new Error("At least one action needed");
  if (data.type == NodeType.CONDITIONAL && !data.conditions?.length)
    throw new Error("At least one condition needed");
  if (prevNode?.type == NodeType.CONDITIONAL && data.condition == NodeEdgesCondition.NONE) {
    throw new Error(
      `Condition must be ('${NodeEdgesCondition.ON_TRUE}' or '${NodeEdgesCondition.ON_FALSE}') for Conditional parent node`
    );
  }
  if (prevNode?.type == NodeType.SWITCH && data.condition) {
    const isValidSwitchCase = patterns.switch_case.test(data.condition);
    // const isNone = data.condition === NodeEdgesCondition.NONE;

    if (!isValidSwitchCase) {
      throw new Error(
        `Condition must be a valid switch case (e.g., 'case_1', 'case_2', ...) for Switch parent node`
      );
    }
  }

  if (
    ![NodeType.CONDITIONAL, NodeType.SWITCH].includes(prevNode?.type as NodeType) &&
    data.condition &&
    data.condition != NodeEdgesCondition.NONE
  ) {
    throw new Error(
      `Condition must be '${NodeEdgesCondition.NONE}' for non-Conditional parent node`
    );
  }

  if (
    data.type == NodeType.LOOP &&
    !data.configuration &&
    !data.configuration?.["loop_configuration"]
  )
    throw new Error("Loop Configuration is required for Loop Node");
  if (data.type != NodeType.LOOP && data.configuration?.["loop_configuration"])
    throw new Error("Loop Configuration is only for Loop Node");

  if (data.type == NodeType.SWITCH && !data.configuration && !data.configuration?.["switch_cases"])
    throw new Error("Switch Cases is required for Switch Node");
  if (data.type != NodeType.SWITCH && data.configuration?.["switch_cases"])
    throw new Error("Switch Cases is only for Switch Node");
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

export async function updateNode(nodeId: string, data: UpdateNodeRecord): Promise<Node> {
  try {
    const existingNode = await getNodeById(nodeId);
    if (!existingNode) throw new Error(`Node not found with ID: ${nodeId}`);
    if (data.type && data.type !== existingNode.type) {
      throw new Error(
        `Node type cannot be updated. Please remove node ${nodeId} and create a new one.`
      );
    }

    const node = await prisma.node.update({
      where: { id: nodeId },
      data: {
        name: data.name ?? existingNode.name,
      },
    });

    switch (existingNode.type) {
      case NodeType.ACTION:
        await upsertManyActionNodes(nodeId, data.actions || []);
        break;

      case NodeType.CONDITIONAL:
        await upsertManyConditionsNodes(nodeId, data.conditions || []);
        break;

      case NodeType.LOOP:
        data.configuration?.loop_configuration &&
          (await updateNodeConfig(nodeId, data.configuration?.loop_configuration));
        break;

      default:
        break;
    }
    return node;
  } catch (error) {
    console.error("ERROR: TO UPDATE NODE", error);
    throw error;
  }
}

export async function updateNodeParent(nodeId: string, parentId?: string): Promise<void> {
  try {
    if (nodeId == parentId) return;
    if (!parentId) parentId = undefined;
    await prisma.node.update({ where: { id: nodeId }, data: { parent_id: parentId } });
  } catch (error) {
    console.error("ERROR: TO UPDATE NODE PARENT", error);
    throw error;
  }
}

export async function deleteNode(nodeId: string): Promise<Node> {
  try {
    const node = await getNodeById(nodeId);
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const incomingEdges = await tx.nodeEdge.findMany({
        where: { workflow_id: node.workflow_id, target_node_id: nodeId },
        include: { sourceNode: true },
      });

      const outgoingEdges = await tx.nodeEdge.findMany({
        where: { workflow_id: node.workflow_id, source_node_id: nodeId },
      });

      await reconnectNodeEdges(tx, node, incomingEdges, outgoingEdges);
      await tx.node.delete({ where: { id: node.id } });
    });
    return node;
  } catch (error) {
    console.error("ERROR: TO DELETE NODE", error);
    throw error;
  }
}

async function getPrevNodeEdge(
  currentNode: Node,
  incomingEdges: GetNodeEdgeWithRelation[]
): Promise<GetNodeEdgeWithRelation | null> {
  if (!incomingEdges.length) return null;
  if (incomingEdges.length == 1) return incomingEdges[0];
  const edge = incomingEdges.find(
    (edge) =>
      (!currentNode.parent_id && edge.group_id == null) ||
      (currentNode.parent_id && edge.group_id !== currentNode.id)
  );
  return edge ?? null;
}

async function getNextNodeEdge(
  currentNode: Node,
  outgoingEdges: GetNodeEdgeWithRelation[]
): Promise<GetNodeEdgeWithRelation | null> {
  if (!outgoingEdges.length) return null;
  if (outgoingEdges.length === 1) return outgoingEdges[0]; // || currentNode.type === NodeType.SWITCH

  const edge = outgoingEdges.find((edge) => {
    const isNormalGroup = !currentNode.parent_id && edge.group_id == null;
    const isParentGroup = currentNode.parent_id && edge.group_id !== currentNode.id;

    if (isNormalGroup || isParentGroup) {
      if (
        currentNode.type === NodeType.CONDITIONAL &&
        edge.condition === NodeEdgesCondition.ON_TRUE
      )
        return true;
      if (currentNode.type === NodeType.LOOP && edge.condition === NodeEdgesCondition.NONE)
        return true;
    }

    return false;
  });

  return edge ?? null;
}

async function reconnectNodeEdges(
  tx: Prisma.TransactionClient,
  currentNode: Node,
  incomingEdges: GetNodeEdgeWithRelation[],
  outgoingEdges: GetNodeEdgeWithRelation[]
): Promise<void> {
  const prevNodeEdge = await getPrevNodeEdge(currentNode, incomingEdges);
  const nextNodeEdge = await getNextNodeEdge(currentNode, outgoingEdges);

  if (prevNodeEdge && nextNodeEdge) {
    const data = {
      workflow_id: currentNode.workflow_id,
      source_node_id: prevNodeEdge.source_node_id,
      target_node_id: nextNodeEdge.target_node_id,
      condition:
        prevNodeEdge.sourceNode?.["type"] == NodeType.CONDITIONAL
          ? NodeEdgesCondition.ON_TRUE
          : NodeEdgesCondition.NONE,
      group_id: prevNodeEdge.group_id ?? null,
    };
    await tx.nodeEdge.create({ data });
  }
  if (currentNode.type == NodeType.LOOP) {
    await tx.node.updateMany({
      where: { parent_id: currentNode.id },
      data: { parent_id: currentNode.parent_id ?? null },
    });
    await tx.nodeEdge.updateMany({
      where: { group_id: currentNode.id },
      data: { group_id: currentNode.parent_id ?? null },
    });
  }
}

// async function checkUpdateNodeValidations(data: CreateNodeRecord, prevNode: Node | null) {
//   if (data.type == NodeType.ACTION && !data.actions?.length) throw new Error("At least one action needed");
//   if (data.type == NodeType.CONDITIONAL && !data.conditions?.length) throw new Error("At least one condition needed");
//   if (data.type == NodeType.LOOP && !data.configuration?.loop_configuration)
//     throw new Error("Loop Configuration is required for Loop Node");
//   if (data.type != NodeType.LOOP && data.configuration?.loop_configuration)
//     throw new Error("Loop Configuration is only for Loop Node");
// }
