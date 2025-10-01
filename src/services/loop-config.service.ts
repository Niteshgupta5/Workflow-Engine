import { LoopConfiguration } from "@prisma/client";
import { prisma } from "../config";
import { LoopConfigurationRecord } from "../types";

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
