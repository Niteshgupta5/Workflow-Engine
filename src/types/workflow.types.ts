import { Prisma } from "@prisma/client";

// Define the type with included relations
export type WorkflowWithRelations = Prisma.WorkflowGetPayload<{
  include: { triggers: true; nodes: true };
}>;

export interface CreateWorkflowRecord {
  name: string;
  description?: string;
}
