import { Router } from "express";
import { workflowRouter } from "./workflow.routes";
import { triggerRouter } from "./trigger.routes";
import { nodeRouter } from "./node.routes";

export const apiRouter = Router();

apiRouter.use("/workflow", workflowRouter);
apiRouter.use("/trigger", triggerRouter);
apiRouter.use("/node", nodeRouter);
