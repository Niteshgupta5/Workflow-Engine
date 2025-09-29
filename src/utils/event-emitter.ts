// import { EventEmitter } from "events";
// import { getTriggersByEvent } from "../services/triggerService";
// import { executeTrigger, runWorkflow } from "../executor";

// export const workflowEvents = new EventEmitter();

// workflowEvents.on("user.created", async (payload) => {
//   const triggers = await getTriggersByEvent("user.created");

//   for (const trigger of triggers) {
//     try {
//       //   const { executionId } = await executeTrigger(trigger.id, payload);
//       //   await runWorkflow(trigger.workflow_id, executionId, payload);
//     } catch (err) {
//       console.error("Event execution failed", err);
//     }
//   }
// });
