import {
  createExecution,
  getEntryNode,
  getExecutionById,
  getTriggerById,
  getWorkflowById,
  updateExecution,
} from "../services";
import { ExecutionStatus, ExtendedNode, HttpMethod, NodeType, TriggerConfiguration, TriggerType } from "../types";
import { httpRequest } from "../utils";
import { runNode } from "./node-runner";

export async function runWorkflow(
  workflowId: string,
  executionId: string,
  inputContext: Record<string, any> = {}
): Promise<void> {
  const workflow = await getWorkflowById(workflowId);

  if (!workflow) throw new Error("Workflow not found");
  if (!workflow.enabled) throw new Error("Workflow is not enabled");
  await getExecutionById(executionId);
  console.log(`==== Execution ${executionId} started for workflow ${workflow.name} ====`);

  const context: Record<string, any> = {
    ...inputContext,
    output: {},
  };

  let currentNode = await getEntryNode(workflow.id); // entry node
  let prevNodeId: string | null = null;

  while (currentNode) {
    try {
      // Type assertion for node with proper config type
      const typedNode = currentNode as ExtendedNode<NodeType>;

      const result = await runNode(
        executionId,
        typedNode,
        inputContext,
        context,
        prevNodeId,
        null // groupId
      );

      // Store node result in context
      context.output[currentNode.id] = result.nodeResult;

      if (result.error) throw result.error;

      prevNodeId = currentNode.id;
      currentNode = result.nextNode;

      // Update execution status only when workflow completes
      await updateExecution(executionId, {
        status: ExecutionStatus.COMPLETED,
        completed_at: new Date(),
        context,
      });
      !currentNode && console.log(`==== Execution ${executionId} Completed ====`);
    } catch (error: any) {
      await updateExecution(executionId, {
        status: ExecutionStatus.FAILED,
        context,
      });
      console.log(`❌ Execution ${executionId} failed`, error.response?.data);
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || error.message || "Unknown Error";
      throw new Error(`${errorMessage}`);
    }
  }
}

export async function executeTrigger(
  triggerId: string,
  inputContext: Record<string, any>
): Promise<{
  status: number;
  executionId: string;
  message?: string;
  error?: string;
}> {
  const trigger = await getTriggerById(triggerId);
  const config = trigger.configuration as TriggerConfiguration;

  let execution = await createExecution({
    workflow_id: trigger.workflow_id,
    trigger_id: trigger.id,
    status: ExecutionStatus.RUNNING,
    context: { input: inputContext },
  });

  try {
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

        await httpRequest(HttpMethod.POST, `${process.env.BASE_URL}/workflow/${trigger.workflow_id}/run`, {
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
        return {
          status: 400,
          error: "Unsupported trigger type",
          executionId: execution.id,
        };
    }

    return {
      status: 200,
      message: "Workflow execution started",
      executionId: execution.id,
    };
  } catch (error: any) {
    await updateExecution(execution.id, {
      status: ExecutionStatus.FAILED,
      context: {
        input: inputContext,
      },
      completed_at: new Date(),
    });
    console.error("Error: In Trigger Execution");
    const errorMessage =
      error.response?.data?.message || error.response?.data?.error || error.message || "Unknown Error";
    return {
      status: error.response?.status || 500,
      error: `${errorMessage}`,
      executionId: execution.id,
    };
  }
}
