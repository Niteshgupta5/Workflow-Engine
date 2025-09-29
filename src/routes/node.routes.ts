import { Router } from "express";
import { createNode } from "../services";
import { nodeSchema, validateRequest } from "../validation";
import { CreateNodeRecord } from "../types";

export const nodeRouter = Router();

nodeRouter.post("/", validateRequest<CreateNodeRecord>(nodeSchema), async (req, res) => {
  try {
    const node = await createNode(req.body);
    res.json(node);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
