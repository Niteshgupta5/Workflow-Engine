import { Router } from "express";
import { createNodeEdge } from "../services";
import { nodeEdgeSchema, validateRequest } from "../validation";
import { CreateNodeEdgeRecord } from "../types";

export const nodeEdgeRouter = Router();

nodeEdgeRouter.post("/", validateRequest<CreateNodeEdgeRecord>(nodeEdgeSchema), async (req, res) => {
  try {
    const nodeEdge = await createNodeEdge(req.body);
    res.json(nodeEdge);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
