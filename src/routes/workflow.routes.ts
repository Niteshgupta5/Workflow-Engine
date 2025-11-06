import { Router } from "express";
import {
  createWorkflow,
  deleteWorkflow,
  getActiveTriggerByWorkflowId,
  getAllTriggersByEventName,
  getWorkflowById,
  getWorkflows,
  updateWorkflow,
} from "../services";
import { executeTrigger, getBeingIdData, runWorkflow } from "../engine";
import { createWorkflowSchema, deleteWorkflowSchema, validateRequest } from "../validation";
import { CreateWorkflowRecord, EventName, IdParameter } from "../types";
import { httpRequest } from "../utils";

export const workflowRouter = Router();

workflowRouter.post("/", validateRequest<CreateWorkflowRecord>(createWorkflowSchema), async (req, res) => {
  try {
    const data = await createWorkflow(req.body);
    res.json({ message: "Workflows created successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

workflowRouter.patch("/:id", validateRequest<CreateWorkflowRecord>(createWorkflowSchema), async (req, res) => {
  try {
    const data = await updateWorkflow(req.params.id, req.body);
    res.json({ message: "Workflows updated successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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
    const data = await getWorkflowById(req.params.id, true);
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

workflowRouter.delete("/:id", validateRequest<IdParameter>(deleteWorkflowSchema), async (req, res) => {
  try {
    const data = await deleteWorkflow(req.params.id);
    res.json({ message: "Workflow deleted successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

workflowRouter.post("/:workflowId/execute", async (req, res) => {
  const { workflowId } = req.params as any;
  const inputContext = req.body || {};
  const trigger = await getActiveTriggerByWorkflowId(workflowId);
  if (!trigger) {
    return res.status(400).json({ error: "No active trigger found for the workflow" });
  }
  const { status, ...rest } = await executeTrigger(trigger?.id, inputContext);
  res.status(status).json(rest);
});

workflowRouter.post("/run", async (req, res) => {
  const { eventName, data } = req.body;
  if (eventName == EventName.KYC_INVITATION_COMPLETION) {
    const { url, method, headers, body } = await getBeingIdData(data.userId);
    const userData = await httpRequest(method, url, body, headers, true);
    data["beingId"] = userData.level;
  }
  const triggers = await getAllTriggersByEventName(eventName);
  triggers.forEach(async (trigger) => {
    await executeTrigger(trigger.id, data || {});
  });
  res.json({ message: "Workflow Execution Started!" });
});
