import { ActionNode, Prisma } from "@prisma/client";
import { prisma } from "../config";
import { UpdateActionNodeRecord } from "../types";

export async function createActionNodes(data: Prisma.ActionNodeCreateManyInput[]): Promise<{ count: number }> {
  try {
    return await prisma.actionNode.createMany({ data });
  } catch (error) {
    console.error("ERROR: Failed to create action nodes", error);
    throw error;
  }
}

export async function getNodeActions(nodeId: string): Promise<ActionNode[]> {
  try {
    return await prisma.actionNode.findMany({
      where: { node_id: nodeId },
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("ERROR: Failed to Fetch action nodes", error);
    throw error;
  }
}

export async function upsertManyActionNodes(nodeId: string, actions: UpdateActionNodeRecord[]): Promise<void> {
  try {
    if (!actions?.length) return;
    const existingActions = await prisma.actionNode.findMany({ where: { node_id: nodeId } });
    const actionMap = new Map(existingActions.map((action) => [action.id, action.action_name]));

    for (const action of actions) {
      const actionName = action.id ? actionMap.get(action.id) : null;
      if (actionName && action.action_name !== actionName) {
        throw new Error(
          `Action type cannot be changed for action ${action.id}. Please remove and create a new action.`
        );
      }
    }

    // Delete actions that are removed in update
    const updatedActionIds = actions.map((a) => a.id).filter(Boolean);
    await prisma.actionNode.deleteMany({
      where: { node_id: nodeId, id: { notIn: updatedActionIds } },
    });

    // Upsert actions
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      await prisma.actionNode.upsert({
        where: { id: action.id || "" },
        update: {
          params: action.params,
          retry_attempts: action.retry_attempts,
          retry_delay_ms: action.retry_delay_ms,
          order: i + 1,
        },
        create: {
          node_id: nodeId,
          action_name: action.action_name,
          params: action.params as any,
          retry_attempts: action.retry_attempts,
          retry_delay_ms: action.retry_delay_ms,
          order: i + 1,
        },
      });
    }
  } catch (error) {
    console.error("ERROR: TO UPSERT MANY ACTION NODES", error);
    throw error;
  }
}
