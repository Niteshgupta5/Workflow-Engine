import { Configuration } from "@prisma/client";
import { prisma } from "../config";
import { ConfigurationRecord, UpdateConfigurationRecord } from "../types";

export async function createNodeConfig(data: ConfigurationRecord): Promise<Configuration> {
  try {
    return await prisma.configuration.create({ data });
  } catch (error) {
    console.error("ERROR: TO CREATE LOOP CONFIGURATION", error);
    throw error;
  }
}

export async function getNodeConfig(nodeId: string): Promise<Configuration | null> {
  try {
    return await prisma.configuration.findFirst({
      where: { node_id: nodeId },
    });
  } catch (error) {
    console.error("ERROR: FAILED TO FETCH LOOP CONFIGS", error);
    throw error;
  }
}

export async function updateNodeConfig(nodeId: string, data: UpdateConfigurationRecord): Promise<void> {
  try {
    if (!data) return;

    const config = await getNodeConfig(nodeId);
    if (!config) throw new Error(`Loop configuration not found for node ${nodeId}.`);

    await prisma.configuration.update({
      where: { id: config.id },
      data: {
        loop_type: data.loop_type,
        max_iterations: data.max_iterations,
        exit_condition: data.exit_condition,
        data_source_path: data.data_source_path,
        switch_cases: data.switch_cases,
      },
    });
  } catch (error) {
    console.error("ERROR: TO UPDATE LOOP CONFIGURATION", error);
    throw error;
  }
}
