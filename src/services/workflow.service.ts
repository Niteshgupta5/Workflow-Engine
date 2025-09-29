import { Workflow } from "@prisma/client";
import { prisma } from "../config";
import { CreateWorkflowRecord } from "../types";

export async function createWorkflow(data: CreateWorkflowRecord): Promise<Workflow> {
  return prisma.workflow.create({ data });
}

export async function getWorkflows(): Promise<Workflow[]> {
  try {
    return await prisma.workflow.findMany({
      include: {
        triggers: true,
        nodes: {
          include: { actionNode: true, condition: true },
          orderBy: { created_at: "asc" },
        },
        node_edges: true,
      },
    });
  } catch (error) {
    console.error("ERROR: TO GET WORKFLOW List", error);
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
