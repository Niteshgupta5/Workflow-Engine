import { Router } from "express";
import { createTrigger, deleteTrigger, getTriggerById, updateTrigger } from "../services";
import { executeTrigger } from "../engine";
import {
  createTriggerSchema,
  deleteTriggerSchema,
  getTriggerSchema,
  updateTriggerSchema,
  validateRequest,
} from "../validation";
import { CreateTriggerRecord, IdParameter, UpdateTriggerRecord } from "../types";

export const triggerRouter = Router();

triggerRouter.post("/", validateRequest<CreateTriggerRecord>(createTriggerSchema), async (req, res) => {
  try {
    const data = await createTrigger(req.body);
    res.json({ message: "Trigger created successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

triggerRouter.get("/:id", validateRequest<IdParameter>(getTriggerSchema), async (req, res) => {
  try {
    const data = await getTriggerById(req.params.id);
    res.json({ message: "Trigger get successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

triggerRouter.patch("/:id/update", validateRequest<UpdateTriggerRecord>(updateTriggerSchema), async (req, res) => {
  try {
    const data = await updateTrigger(req.params.id, req.body);
    res.json({ message: "Trigger updated successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

triggerRouter.post("/:triggerId/execute", async (req, res) => {
  try {
    const { triggerId } = req.params as any;
    const inputContext = req.body || {};
    const { status, ...rest } = await executeTrigger(triggerId, inputContext);
    res.json(rest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

triggerRouter.delete("/:id", validateRequest<IdParameter>(deleteTriggerSchema), async (req, res) => {
  try {
    const data = await deleteTrigger(req.params.id);
    res.json({ message: "Trigger deleted successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
