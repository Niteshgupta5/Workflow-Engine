import { LoopConfiguration } from "@prisma/client";
import { prisma } from "../config";
import { LoopConfigurationRecord, UpdateLoopConfigurationRecord } from "../types";

export async function createLoopConfig(data: LoopConfigurationRecord): Promise<LoopConfiguration> {
  try {
    return await prisma.loopConfiguration.create({ data });
  } catch (error) {
    console.error("ERROR: TO CREATE LOOP CONFIGURATION", error);
    throw error;
  }
}

export async function getLoopConfig(nodeId: string): Promise<LoopConfiguration | null> {
  try {
    return await prisma.loopConfiguration.findFirst({
      where: { node_id: nodeId },
    });
  } catch (error) {
    console.error("ERROR: FAILED TO FETCH LOOP CONFIGS", error);
    throw error;
  }
}

export async function updateLoopConfig(nodeId: string, data: UpdateLoopConfigurationRecord): Promise<void> {
  try {
    if (!data) return;

    const config = await getLoopConfig(nodeId);
    if (!config) throw new Error(`Loop configuration not found for node ${nodeId}.`);

    await prisma.loopConfiguration.update({
      where: { id: config.id },
      data: {
        loop_type: data.loop_type,
        max_iterations: data.max_iterations,
        exit_condition: data.exit_condition,
        data_source_path: data.data_source_path,
      },
    });
  } catch (error) {
    console.error("ERROR: TO UPDATE LOOP CONFIGURATION", error);
    throw error;
  }
}
