import { Router } from "express";
import { workflowRouter } from "./workflow.routes";
import { triggerRouter } from "./trigger.routes";
import { nodeRouter } from "./node.routes";
import { nodeEdgeRouter } from "./node-edge.routes";
import { categoryRouter } from "./category.routes";

export const apiRouter = Router();

apiRouter.use("/workflow", workflowRouter);
apiRouter.use("/trigger", triggerRouter);
apiRouter.use("/node", nodeRouter);
apiRouter.use("/node-edge", nodeEdgeRouter);
apiRouter.use("/category", categoryRouter);
