import { Router } from "express";
import { createNodeEdge, deleteNodeEdgeById } from "../services";
import { deleteNodeEdgeSchema, nodeEdgeSchema, validateRequest } from "../validation";
import { CreateNodeEdgeRecord, IdParameter } from "../types";

export const nodeEdgeRouter = Router();

nodeEdgeRouter.post("/", validateRequest<CreateNodeEdgeRecord>(nodeEdgeSchema), async (req, res) => {
  try {
    const nodeEdge = await createNodeEdge(req.body);
    res.json(nodeEdge);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

nodeEdgeRouter.delete("/:id", validateRequest<IdParameter>(deleteNodeEdgeSchema), async (req, res) => {
  try {
    const nodeEdge = await deleteNodeEdgeById(req.params.id);
    res.json(nodeEdge);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
