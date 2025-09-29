import { Router } from "express";
import { createWorkflow, getWorkflowById, getWorkflows } from "../services";
import { runWorkflow } from "../engine";
import { createWorkflowSchema, validateRequest } from "../validation";
import { CreateWorkflowRecord } from "../types";

export const workflowRouter = Router();

workflowRouter.post("/", validateRequest<CreateWorkflowRecord>(createWorkflowSchema), async (req, res) => {
  try {
    const workflow = await createWorkflow(req.body);
    res.json(workflow);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

workflowRouter.get("/", async (req, res) => {
  try {
    const workflows = await getWorkflows();
    res.json(workflows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

workflowRouter.get("/:id", async (req, res) => {
  try {
    const workflows = await getWorkflowById(req.params.id);
    res.json(workflows);
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
