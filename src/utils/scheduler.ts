import cron from "node-cron";
// import { executeTrigger, runWorkflow } from "../executor";
import { getAllScheduleTriggers } from "../services";

// Load all schedules from DB
export async function startSchedulers() {
  const triggers = await getAllScheduleTriggers();

  triggers.forEach((trigger) => {
    const config = trigger.configuration?.SCHEDULE;
    if (!config) return;

    cron.schedule(
      config.cron_expression,
      async () => {
        try {
          console.log(`Schedule fired: ${trigger.id}`);
          const inputContext = { schedule: true }; // add custom payload if needed
          //   const { executionId } = await executeTrigger(trigger.id, inputContext);
          //   await runWorkflow(trigger.workflow_id, executionId, inputContext);
        } catch (err) {
          console.error("Schedule execution failed", err);
        }
      },
      {
        timezone: config.timezone || "UTC",
      }
    );
  });
}
