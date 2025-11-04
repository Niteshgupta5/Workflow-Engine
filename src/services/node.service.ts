import { Edge, Node, Prisma } from "@prisma/client";
import { prisma } from "../config";
import {
  createNodeEdge,
  deleteNodeEdges,
  updateSwitchCaseExpressions,
  validateSwitchCaseEdgeDuplication,
} from "./node-edge.service";
import {
  CreateNodeRecord,
  GetNodeEdgeWithRelation,
  JsonConfig,
  NodeEdgesCondition,
  NodeType,
  SwitchCaseCondition,
  SwitchConfig,
  UpdateNodeRecord,
} from "../types";
import { PATTERNS, START_NODE_ID } from "../constants";
import { getTemplateIdByNodeType } from "./node-template.service";
import { getWorkflowById } from "./workflow.service";

export async function createNode(data: CreateNodeRecord): Promise<Node & { edges: Edge[] }> {
  try {
    const { workflow_id, type, name, description, configuration, ...rest } = data;
    await getWorkflowById(workflow_id);

    const prevNode =
      rest.prev_node_id && rest.prev_node_id !== START_NODE_ID
        ? await getNodeById(rest.prev_node_id, workflow_id)
        : null;
    await checkNodeValidations(data, prevNode);

    // Create New Node
    const templateId = await getTemplateIdByNodeType(type);
    const newNode = await prisma.node.create({
      data: {
        workflow_id,
        type,
        name,
        description,
        parent_id: rest.group_id || undefined,
        config: configuration as JsonConfig,
        template_id: templateId,
        retry_attempts: rest.retry_attempts ?? undefined,
        retry_delay_ms: rest.retry_delay_ms ?? undefined,
      },
    });

    const edges: Edge[] = [];

    // Create self-edge for loop nodes
    if (newNode.type == NodeType.LOOP) {
      const nodeEdge = await createNodeEdge(
        {
          workflow_id,
          source: newNode.id,
          target: newNode.id,
          condition: NodeEdgesCondition.NONE,
          group_id: newNode.id,
        },
        false
      );
      edges.push(nodeEdge);
    }

    // Edge Handling
    if (prevNode && rest.prev_node_id && rest.prev_node_id !== START_NODE_ID) {
      if (rest.next_node_id) {
        // For In Between Node
        const deletedEdges = await deleteNodeEdges(workflow_id, rest.prev_node_id, rest.next_node_id);

        const nodeEdge1 = await createNodeEdge(
          {
            workflow_id,
            source: rest.prev_node_id,
            target: newNode.id,
            condition: rest.condition ?? NodeEdgesCondition.NONE,
            group_id: rest.group_id || undefined,
            expression: deletedEdges[0].expression ?? undefined,
          },
          false
        );

        const nodeEdge2 = await createNodeEdge({
          workflow_id,
          source: newNode.id,
          target: rest.next_node_id,
          condition: [NodeType.CONDITIONAL, NodeType.RULE_EXECUTOR].includes(newNode.type as NodeType)
            ? NodeEdgesCondition.ON_TRUE
            : newNode.type === NodeType.SWITCH
            ? "case_1"
            : NodeEdgesCondition.NONE,
          group_id: rest.group_id || undefined,
        });

        edges.push(nodeEdge1);
        edges.push(nodeEdge2);
      } else {
        // For Last Node
        const expression = rest.condition ? await getSwitchCaseEdgeExpression(prevNode, rest.condition) : undefined;
        const nodeEdge = await createNodeEdge(
          {
            workflow_id,
            source: rest.prev_node_id,
            target: newNode.id,
            condition: rest.condition ?? NodeEdgesCondition.NONE,
            group_id: rest.group_id || undefined,
            expression,
          },
          false
        );
        edges.push(nodeEdge);
      }
    } else if (rest.prev_node_id === START_NODE_ID && rest.next_node_id) {
      // For Beginning Node
      const nodeEdge = await createNodeEdge(
        {
          workflow_id,
          source: newNode.id,
          target: rest.next_node_id,
          condition: [NodeType.CONDITIONAL, NodeType.RULE_EXECUTOR].includes(newNode.type as NodeType)
            ? NodeEdgesCondition.ON_TRUE
            : newNode.type === NodeType.SWITCH
            ? "case_1"
            : NodeEdgesCondition.NONE,
          group_id: rest.group_id || undefined,
        },
        false
      );
      edges.push(nodeEdge);
    }

    return { ...newNode, edges: edges };
  } catch (error) {
    console.error("ERROR: TO CREATE NODE", error);
    throw error;
  }
}

export async function getNodeById(id: string, workflowId?: string): Promise<Node> {
  try {
    const node = await prisma.node.findUnique({
      where: { id, ...(workflowId ? { workflow_id: workflowId } : {}) },
    });
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
            SELECT target
            FROM "public".edges
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
      throw new Error(`Node type cannot be updated. Please remove node ${nodeId} and create a new one.`);
    }

    const node = await prisma.node.update({
      where: { id: nodeId },
      data: {
        name: data.name ?? existingNode.name,
        description: data.description ?? existingNode.description,
        config: (data.configuration as JsonConfig) ?? existingNode.config,
        retry_attempts: data.retry_attempts ?? undefined,
        retry_delay_ms: data.retry_delay_ms ?? undefined,
      },
    });

    if (existingNode.type == NodeType.SWITCH && data.configuration) {
      if (data.configuration && "switch_cases" in data.configuration) {
        const cases = (data.configuration as { switch_cases: SwitchConfig[] }).switch_cases;
        if (cases) await updateSwitchCaseExpressions(nodeId, cases);
      }
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
    await prisma.node.update({
      where: { id: nodeId },
      data: { parent_id: parentId },
    });
  } catch (error) {
    console.error("ERROR: TO UPDATE NODE PARENT", error);
    throw error;
  }
}

export async function deleteNode(nodeId: string): Promise<Node> {
  try {
    const node = await getNodeById(nodeId);
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const incomingEdges = await tx.edge.findMany({
        where: { workflow_id: node.workflow_id, target: nodeId },
        include: { sourceNode: true },
      });

      const outgoingEdges = await tx.edge.findMany({
        where: { workflow_id: node.workflow_id, source: nodeId },
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
      (!currentNode.parent_id && edge.group_id == null) || (currentNode.parent_id && edge.group_id !== currentNode.id)
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
        [NodeType.CONDITIONAL, NodeType.RULE_EXECUTOR].includes(currentNode.type as NodeType) &&
        edge.condition === NodeEdgesCondition.ON_TRUE
      )
        return true;
      if (
        ![NodeType.CONDITIONAL, NodeType.SWITCH, NodeType.RULE_EXECUTOR].includes(currentNode.type as NodeType) &&
        edge.condition === NodeEdgesCondition.NONE
      )
        return true;
      if (currentNode.type === NodeType.SWITCH && edge.condition === "case_1") return true;
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
      source: prevNodeEdge.source,
      target: nextNodeEdge.target,
      // condition: [NodeType.CONDITIONAL, NodeType.RULE_EXECUTOR].includes(prevNodeEdge.sourceNode?.["type"] as NodeType)
      //   ? NodeEdgesCondition.ON_TRUE
      //   : prevNodeEdge.sourceNode?.["type"] == NodeType.SWITCH
      //   ? "case_1"
      //   : NodeEdgesCondition.NONE,
      condition: prevNodeEdge.condition,
      group_id: prevNodeEdge.group_id ?? null,
      expression: prevNodeEdge.expression ?? undefined,
    };
    await tx.edge.create({ data });
  }
  if (currentNode.type == NodeType.LOOP) {
    await tx.node.updateMany({
      where: { parent_id: currentNode.id },
      data: { parent_id: currentNode.parent_id ?? null },
    });
    await tx.edge.updateMany({
      where: { group_id: currentNode.id },
      data: { group_id: currentNode.parent_id ?? null },
    });
  }
}

async function getSwitchCaseEdgeExpression(
  prevNode: Node,
  condition: NodeEdgesCondition | SwitchCaseCondition
): Promise<string | undefined> {
  if (prevNode.type != NodeType.SWITCH || !PATTERNS.switch_case.test(condition)) return undefined;
  const config = prevNode.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) return undefined;

  const switchCases = config["switch_cases"] as SwitchConfig[] | undefined;
  const expression = switchCases?.find((e) => e.condition === condition)?.expression ?? undefined;
  return expression;
}

async function checkNodeValidations(data: CreateNodeRecord, prevNode: Node | null): Promise<void> {
  if (data.type == NodeType.CONDITIONAL && !data.configuration && !data.configuration?.["conditions"])
    throw new Error("At least one condition needed");
  if (data.type == NodeType.MAP && !data.configuration && !data.configuration?.["mapping"])
    throw new Error("At least one map rule needed");
  if (
    [NodeType.CONDITIONAL, NodeType.RULE_EXECUTOR].includes(prevNode?.type as NodeType) &&
    data.condition == NodeEdgesCondition.NONE
  ) {
    throw new Error(
      `Condition must be ('${NodeEdgesCondition.ON_TRUE}' or '${NodeEdgesCondition.ON_FALSE}') for ${prevNode?.type} parent node`
    );
  }
  if (prevNode?.type == NodeType.SWITCH && data.condition) {
    const isValidSwitchCase = PATTERNS.switch_case.test(data.condition);
    // const isNone = data.condition === NodeEdgesCondition.NONE;

    if (!isValidSwitchCase) {
      throw new Error(`Condition must be a valid switch case (e.g., 'case_1', 'case_2', ...) for Switch parent node`);
    }
    await validateSwitchCaseEdgeDuplication(prevNode, data.condition);
    const expression = await getSwitchCaseEdgeExpression(prevNode, data.condition);
    if (!expression) throw new Error(`Expression not found for the case ${data.condition}`);
  }

  if (
    ![NodeType.CONDITIONAL, NodeType.SWITCH, NodeType.RULE_EXECUTOR].includes(prevNode?.type as NodeType) &&
    data.condition &&
    data.condition != NodeEdgesCondition.NONE
  ) {
    throw new Error(`Condition must be '${NodeEdgesCondition.NONE}' for non-Conditional parent node`);
  }

  if (data.type == NodeType.SWITCH && !data.configuration && !data.configuration?.["switch_cases"])
    throw new Error("At least one switch case is required for Switch Node");
}

// async function checkUpdateNodeValidations(data: CreateNodeRecord, prevNode: Node | null) {
//   if (data.type == NodeType.ACTION && !data.actions?.length) throw new Error("At least one action needed");
//   if (data.type == NodeType.CONDITIONAL && !data.conditions?.length) throw new Error("At least one condition needed");
//   if (data.type == NodeType.LOOP && !data.configuration?.loop_configuration)
//     throw new Error("Loop Configuration is required for Loop Node");
//   if (data.type != NodeType.LOOP && data.configuration?.loop_configuration)
//     throw new Error("Loop Configuration is only for Loop Node");
// }
