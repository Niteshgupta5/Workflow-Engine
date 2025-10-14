import { Trigger } from "@prisma/client";
import { prisma } from "../config";
import { CreateTriggerRecord, HttpMethod, JsonConfig, TriggerType, UpdateTriggerRecord } from "../types";
import { isNilOrEmpty } from "../utils";

export async function createTrigger(data: CreateTriggerRecord): Promise<Trigger> {
  try {
    if (isNilOrEmpty(data.configuration)) {
      data.configuration = { [data.type]: {} };
    }
    const typeConfig = data.configuration[data.type] as JsonConfig | undefined;

    if (typeConfig) {
      typeConfig["endpoint"] = `${process.env.BASE_URL}/workflow/${data.workflow_id}/run`;
      typeConfig["method"] = HttpMethod.POST;
    }

    const activeTrigger = await getActiveTriggerByWorkflowId(data.workflow_id);
    if (activeTrigger) {
      throw new Error(
        "An active trigger already exists for this workflow. Please deactivate it before creating a new one."
      );
    }

    return await prisma.trigger.create({
      data: {
        workflow_id: data.workflow_id,
        name: data.name,
        type: data.type,
        configuration: data.configuration as JsonConfig,
        ...(activeTrigger ? { is_active: false } : {}),
      },
    });
  } catch (error) {
    console.error("ERROR: TO CREATE TRIGGER", error);
    throw error;
  }
}

export async function getActiveTriggerByWorkflowId(workflowId: string): Promise<Trigger | null> {
  try {
    const trigger = await prisma.trigger.findFirst({
      where: { workflow_id: workflowId, is_active: true },
    });
    return trigger;
  } catch (error) {
    console.error("ERROR: TO GET ACTIVE TRIGGER BY WORKFLOW ID", error);
    throw error;
  }
}

export async function getTriggerById(id: string): Promise<Trigger & { configuration: JsonConfig }> {
  try {
    const trigger = await prisma.trigger.findUnique({ where: { id } });
    if (!trigger) throw Error("Error: Trigger Not Found");
    return { ...trigger, configuration: trigger.configuration as JsonConfig };
  } catch (error) {
    console.error("ERROR: TO GET TRIGGER BY ID", error);
    throw error;
  }
}

export async function updateTrigger(id: string, data: UpdateTriggerRecord): Promise<Trigger> {
  try {
    const existing = await getTriggerById(id);
    if (data.type && data.type !== existing.type) {
      throw new Error(`Trigger type cannot be updated. Please remove trigger ${id} and create a new one.`);
    }

    if (data.configuration) {
      (data.configuration[data.type] as JsonConfig)[
        "endpoint"
      ] = `${process.env.BASE_URL}/workflow/${existing.workflow_id}/run`;
      (data.configuration[data.type] as JsonConfig)["method"] = HttpMethod.POST;
    }

    const updatedTrigger = await prisma.trigger.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        type: data.type ?? existing.type,
        configuration: (data.configuration as JsonConfig) ?? existing.configuration,
      },
    });
    return updatedTrigger;
  } catch (error) {
    console.error("ERROR: TO UPDATE TRIGGER", error);
    throw error;
  }
}

export async function deleteTrigger(id: string): Promise<Trigger> {
  try {
    const trigger = await getTriggerById(id);
    await prisma.trigger.delete({ where: { id } });
    return trigger;
  } catch (error) {
    console.error("ERROR: TO DELETE TRIGGER", error);
    throw error;
  }
}

export async function getAllScheduleTriggers(): Promise<(Trigger & { configuration: JsonConfig })[]> {
  try {
    const triggers = await prisma.trigger.findMany({ where: { type: TriggerType.SCHEDULE } });
    return triggers.map((trigger) => ({ ...trigger, configuration: trigger.configuration as JsonConfig }));
  } catch (error) {
    console.error("ERROR: TO GET ALL SCHEDULE TRIGGERS", error);
    throw error;
  }
}
