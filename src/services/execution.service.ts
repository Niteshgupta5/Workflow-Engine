import { Execution } from "@prisma/client";
import { prisma } from "../config";
import { CreateExecutionRecord, ExecutionStatus } from "../types";

export async function createExecution(data: CreateExecutionRecord): Promise<Execution> {
  try {
    return await prisma.execution.create({ data });
  } catch (error) {
    console.error("ERROR: TO CREATE EXECUTION", error);
    throw error;
  }
}

export async function getExecutionById(id: string): Promise<Execution> {
  try {
    const execution = await prisma.execution.findUnique({ where: { id } });
    if (!execution) throw Error("Error: Execution Not Found");
    return execution;
  } catch (error) {
    console.error("ERROR: TO GET EXECUTION BY ID", error);
    throw error;
  }
}

export async function updateExecution(
  id: string,
  data: {
    status?: ExecutionStatus;
    context?: any;
    completed_at?: Date;
  }
) {
  try {
    return await prisma.execution.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.context !== undefined && { context: data.context }),
        ...(data.completed_at !== undefined && {
          completed_at: data.completed_at,
        }),
      },
    });
  } catch (error) {
    console.error("ERROR: TO UPDATE EXECUTION", error);
    throw error;
  }
}
