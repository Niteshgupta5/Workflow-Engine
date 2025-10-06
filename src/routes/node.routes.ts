import { Router } from "express";
import { createNode, deleteNode, updateNode } from "../services";
import { deleteNodeSchema, nodeSchema, updateNodeSchema, validateRequest } from "../validation";
import { CreateNodeRecord, IdParameter, UpdateNodeRecord } from "../types";

export const nodeRouter = Router();

nodeRouter.post("/", validateRequest<CreateNodeRecord>(nodeSchema), async (req, res) => {
  try {
    const node = await createNode(req.body);
    res.json(node);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

nodeRouter.patch("/:id", validateRequest<UpdateNodeRecord>(updateNodeSchema), async (req, res) => {
  try {
    const node = await updateNode(req.params.id, req.body);
    res.json(node);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

nodeRouter.delete("/:id", validateRequest<IdParameter>(deleteNodeSchema), async (req, res) => {
  try {
    const data = await deleteNode(req.params.id);
    res.json({ message: "Node deleted successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
