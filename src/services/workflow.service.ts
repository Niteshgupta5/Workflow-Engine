import { Workflow } from "@prisma/client";
import { prisma } from "../config";
import { CreateWorkflowRecord } from "../types";

export async function createWorkflow(data: CreateWorkflowRecord): Promise<Workflow> {
  try {
    return prisma.workflow.create({ data });
  } catch (error) {
    console.error("ERROR: ON CREATE WORKFLOW", error);
    throw error;
  }
}

export async function updateWorkflow(id: string, data: CreateWorkflowRecord): Promise<Workflow> {
  try {
    await getWorkflowById(id);
    return prisma.workflow.update({ where: { id }, data });
  } catch (error) {
    console.error("ERROR: ON UPDATE WORKFLOW", error);
    throw error;
  }
}

export async function getWorkflows(): Promise<Workflow[]> {
  try {
    return await prisma.workflow.findMany({
      include: {
        triggers: true,
        nodes: {
          include: { actionNode: true, condition: true, Configuration: true },
          orderBy: { created_at: "asc" },
        },
        node_edges: true,
      },
    });
  } catch (error) {
    console.error("ERROR: TO GET WORKFLOW LIST", error);
    throw error;
  }
}

export async function getWorkflowById(workflowId: string): Promise<Workflow> {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });
    if (!workflow) throw Error("Error: Workflow Not Found");
    return workflow;
  } catch (error) {
    console.error("ERROR: TO GET WORKFLOW BY ID", error);
    throw error;
  }
}

export async function deleteWorkflow(id: string): Promise<Workflow> {
  try {
    const workflow = await getWorkflowById(id);
    await prisma.workflow.delete({ where: { id } });
    return workflow;
  } catch (error) {
    console.error("ERROR: TO DELETE WORKFLOW", error);
    throw error;
  }
}
