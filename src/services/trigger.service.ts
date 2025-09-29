import { Trigger } from "@prisma/client";
import { prisma } from "../config";
import { CreateTriggerRecord, HttpMethod, JsonConfig, TriggerType, UpdateTriggerRecord } from "../types";
import { isNilOrEmpty } from "../utils";

export async function createTrigger(data: CreateTriggerRecord): Promise<Trigger> {
  try {
    if (isNilOrEmpty(data.configuration)) {
      data.configuration = { [data.type]: {} };
    }
    if (isNilOrEmpty(data.configuration[data.type])) {
      (data.configuration[data.type] as JsonConfig)[
        "endpoint"
      ] = `${process.env.BASE_URL}/workflow/${data.workflow_id}/run`;
      (data.configuration[data.type] as JsonConfig)["method"] = HttpMethod.POST;
    }
    return await prisma.trigger.create({
      data: {
        workflow_id: data.workflow_id,
        name: data.name,
        type: data.type,
        configuration: data.configuration as JsonConfig,
      },
    });
  } catch (error) {
    console.error("ERROR: TO CREATE TRIGGER", error);
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
    const { type } = data as any;

    const existing = await getTriggerById(id);
    const updatedTrigger = await prisma.trigger.update({
      where: { id },
      data: {
        type: type ?? existing.type,
      },
    });
    return updatedTrigger;
  } catch (error) {
    console.error("ERROR: TO UPDATE TRIGGER", error);
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
