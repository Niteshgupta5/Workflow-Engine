import { createExecution, getEntryNode, getTriggerById, getWorkflowById, updateExecution } from "../services";
import { ExecutionStatus, TriggerConfiguration, TriggerType } from "../types";
import { httpRequest } from "../utils";
import { runNode } from "./node-runner";

export async function runWorkflow(workflowId: string, executionId: string, inputContext: Record<string, any> = {}) {
  const workflow = await getWorkflowById(workflowId);

  if (!workflow) throw new Error("Workflow not found");
  if (!workflow.enabled) throw new Error("Workflow is not enabled");
  console.log(`▶️ Execution ${executionId} started for workflow ${workflow.name}`);

  const context: Record<string, any> = {
    ...inputContext,
    output: {},
  };

  let currentNode = await getEntryNode(workflow.id); // entry node
  let prevNodeId = null; // To fetch result of previous node if needed
  while (currentNode) {
    const result = await runNode(executionId, currentNode, inputContext, prevNodeId);
    context.output[currentNode.id] = result.nodeResult;
    prevNodeId = currentNode.id;
    currentNode = result.nextNode;
  }
  await updateExecution(executionId, {
    status: ExecutionStatus.COMPLETED,
    completed_at: new Date(),
    context,
  });

  console.log(`✅ Execution ${executionId} completed`);
}

export async function executeTrigger(triggerId: string, inputContext: Object) {
  let execution;
  const trigger = await getTriggerById(triggerId);
  const config = trigger.configuration as TriggerConfiguration;

  try {
    execution = await createExecution({
      workflow_id: trigger.workflow_id,
      trigger_id: trigger.id,
      status: ExecutionStatus.RUNNING,
      context: { input: inputContext },
    });

    switch (trigger.type) {
      case TriggerType.WEBHOOK:
        const webhookConfig = config[TriggerType.WEBHOOK];
        if (!webhookConfig) throw new Error("Invalid WEBHOOK configuration");

        await httpRequest(webhookConfig.method, webhookConfig.endpoint, {
          executionId: execution.id,
          context: { input: inputContext },
        });
        break;

      case TriggerType.SCHEDULE:
        const scheduleConfig = config[TriggerType.SCHEDULE];
        if (!scheduleConfig) throw new Error("Invalid SCHEDULE configuration");

        await httpRequest(scheduleConfig.method, scheduleConfig.endpoint, {
          executionId: execution.id,
          context: {
            schedule: true,
            cron: scheduleConfig.cron_expression,
            timezone: scheduleConfig.timezone,
            input: inputContext,
          },
        });
        break;

      case TriggerType.EVENT:
        const eventConfig = config[TriggerType.EVENT];
        if (!eventConfig) throw new Error("Invalid EVENT configuration");

        await httpRequest(eventConfig.method, eventConfig.endpoint, {
          executionId: execution.id,
          context: {
            eventName: eventConfig.event_name,
            input: inputContext,
          },
        });
        break;

      case TriggerType.HTTP_REQUEST:
        const httpConfig = config[TriggerType.HTTP_REQUEST];
        if (!httpConfig) throw new Error("Invalid HTTP_REQUEST configuration");

        await httpRequest(httpConfig.method, httpConfig.endpoint, {
          executionId: execution.id,
          context: { input: inputContext },
        });
        break;

      default:
        return { status: 400, error: "Unsupported trigger type" };
    }

    return {
      status: 200,
      message: "Workflow execution started",
      executionId: execution.id,
    };
  } catch (error) {
    await updateExecution(execution?.id || "", {
      status: ExecutionStatus.FAILED,
      context: {
        input: inputContext,
      },
      completed_at: new Date(),
    });
    console.error("Error: In Trigger Execution", error);
    throw error;
  }
}
