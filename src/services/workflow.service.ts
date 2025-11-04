import { Workflow } from "@prisma/client";
import { prisma } from "../config";
import { CreateWorkflowRecord } from "../types";

export async function createWorkflow(data: CreateWorkflowRecord): Promise<Workflow> {
  try {
    await checkDuplicateWorkflowName(data.name);
    return prisma.workflow.create({ data });
  } catch (error) {
    console.error("ERROR: ON CREATE WORKFLOW", error);
    throw error;
  }
}

export async function updateWorkflow(id: string, data: CreateWorkflowRecord): Promise<Workflow> {
  try {
    await checkDuplicateWorkflowName(data.name, id);
    await getWorkflowById(id);
    return prisma.workflow.update({ where: { id }, data });
  } catch (error) {
    console.error("ERROR: ON UPDATE WORKFLOW", error);
    throw error;
  }
}

export async function checkDuplicateWorkflowName(name: string, id?: string): Promise<boolean> {
  try {
    const existingWorkflow = await prisma.workflow.findFirst({ where: { name, NOT: id ? { id } : undefined } });
    if (existingWorkflow) {
      throw new Error("Workflow with the same name already exists");
    }
    return true;
  } catch (error) {
    console.error("ERROR: ON CHECK DUPLICATE WORKFLOW NAME", error);
    throw error;
  }
}

export async function getWorkflows(): Promise<Workflow[]> {
  try {
    return await prisma.workflow.findMany({
      include: {
        triggers: true,
        nodes: {
          orderBy: { created_at: "asc" },
        },
        edges: true,
      },
    });
  } catch (error) {
    console.error("ERROR: TO GET WORKFLOW LIST", error);
    throw error;
  }
}

export async function getWorkflowById(workflowId: string, withRelation: boolean = false): Promise<Workflow> {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      ...(withRelation && {
        include: {
          triggers: true,
          nodes: {
            orderBy: { created_at: "asc" },
          },
          edges: true,
        },
      }),
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
