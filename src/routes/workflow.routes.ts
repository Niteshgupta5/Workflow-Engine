import { Router } from "express";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowById,
  getWorkflows,
  updateWorkflow,
} from "../services";
import { runWorkflow } from "../engine";
import {
  createWorkflowSchema,
  deleteWorkflowSchema,
  validateRequest,
} from "../validation";
import { CreateWorkflowRecord, IdParameter } from "../types";

export const workflowRouter = Router();

workflowRouter.post(
  "/",
  validateRequest<CreateWorkflowRecord>(createWorkflowSchema),
  async (req, res) => {
    try {
      const data = await createWorkflow(req.body);
      res.json({ message: "Workflows created successfully!", data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

workflowRouter.patch(
  "/:id",
  validateRequest<CreateWorkflowRecord>(createWorkflowSchema),
  async (req, res) => {
    try {
      const data = await updateWorkflow(req.params.id, req.body);
      res.json({ message: "Workflows updated successfully!", data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

workflowRouter.get("/", async (req, res) => {
  try {
    const data = await getWorkflows();
    res.json({ message: "Workflows get successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

workflowRouter.get("/:id", async (req, res) => {
  try {
    const data = await getWorkflowById(req.params.id);
    res.json({ message: "Workflow get successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

workflowRouter.post("/:id/run", async (req, res) => {
  try {
    const { executionId, context } = req.body;
    await runWorkflow(req.params.id, executionId, context || {});
    res.json({ message: "Workflow execution started" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

workflowRouter.delete(
  "/:id",
  validateRequest<IdParameter>(deleteWorkflowSchema),
  async (req, res) => {
    try {
      const data = await deleteWorkflow(req.params.id);
      res.json({ message: "Workflow deleted successfully!", data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);
