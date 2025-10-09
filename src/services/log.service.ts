import { NodeExecutionLog, Prisma } from "@prisma/client";
import { prisma } from "../config";

export async function logNodeExecution(
  data: Prisma.NodeExecutionLogUncheckedCreateInput
): Promise<NodeExecutionLog> {
  try {
    return await prisma.nodeExecutionLog.create({ data });
  } catch (error) {
    console.error("ERROR: TO CREATE EXECUTION LOG", error);
    throw error;
  }
}

export async function updateNodeExecutionLog(
  id: string,
  data: Prisma.NodeExecutionLogUncheckedUpdateInput
) {
  try {
    return await prisma.nodeExecutionLog.update({ where: { id }, data });
  } catch (error) {
    console.error("ERROR: TO UPDATE EXECUTION LOG", error);
    throw error;
  }
}

export async function logTaskExecution(data: Prisma.NodeTaskLogUncheckedCreateInput) {
  try {
    return await prisma.nodeTaskLog.create({ data });
  } catch (error) {
    console.error("ERROR: TO CREATE TASK EXECUTION LOG", error);
    throw error;
  }
}

export async function updateTaskLog(id: string, data: Prisma.NodeTaskLogUncheckedUpdateInput) {
  try {
    return await prisma.nodeTaskLog.update({ where: { id }, data });
  } catch (error) {
    console.error("ERROR: TO UPDATE TASK EXECUTION LOG", error);
    throw error;
  }
}
