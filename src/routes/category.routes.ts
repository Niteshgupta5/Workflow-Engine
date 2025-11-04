import { Router } from "express";
import { getAllCategoriesWithTemplates } from "../services";

export const categoryRouter = Router();

categoryRouter.get("/", async (req, res) => {
  try {
    const data = await getAllCategoriesWithTemplates();
    res.json({ message: "Categories get successfully!", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
