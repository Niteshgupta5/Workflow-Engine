import { Router } from "express";
import { createTrigger, updateTrigger } from "../services";
import { executeTrigger } from "../engine";
import { createTriggerSchema, updateTriggerSchema, validateRequest } from "../validation";
import { CreateTriggerRecord, UpdateTriggerRecord } from "../types";

export const triggerRouter = Router();

triggerRouter.post("/", validateRequest<CreateTriggerRecord>(createTriggerSchema), async (req, res) => {
  try {
    const trigger = await createTrigger(req.body);
    res.json(trigger);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

triggerRouter.patch("/:id/update", validateRequest<UpdateTriggerRecord>(updateTriggerSchema), async (req, res) => {
  try {
    const trigger = await updateTrigger(req.params.id, req.body);
    res.json(trigger);
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
