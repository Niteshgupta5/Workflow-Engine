/*
  Warnings:

  - You are about to drop the `Execution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Node` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NodeExecutionLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Trigger` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Workflow` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Execution" DROP CONSTRAINT "Execution_trigger_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Execution" DROP CONSTRAINT "Execution_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Node" DROP CONSTRAINT "Node_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."NodeExecutionLog" DROP CONSTRAINT "NodeExecutionLog_execution_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."NodeExecutionLog" DROP CONSTRAINT "NodeExecutionLog_node_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Trigger" DROP CONSTRAINT "Trigger_workflow_id_fkey";

-- DropTable
DROP TABLE "public"."Execution";

-- DropTable
DROP TABLE "public"."Node";

-- DropTable
DROP TABLE "public"."NodeExecutionLog";

-- DropTable
DROP TABLE "public"."Trigger";

-- DropTable
DROP TABLE "public"."Workflow";

-- CreateTable
CREATE TABLE "public"."workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."triggers" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nodes" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."node_edges" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,
    "condition" TEXT,

    CONSTRAINT "node_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."action_nodes" (
    "id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "action_name" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "retry_attempts" INTEGER,
    "retry_delay_ms" INTEGER,

    CONSTRAINT "action_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conditional_nodes" (
    "id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "expression" TEXT NOT NULL,

    CONSTRAINT "conditional_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."executions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "trigger_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "context" JSONB NOT NULL,

    CONSTRAINT "executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."node_execution_logs" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "data" JSONB NOT NULL,

    CONSTRAINT "node_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."node_task_logs" (
    "id" TEXT NOT NULL,
    "node_log_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "actionNodeId" TEXT,
    "conditionalNodeId" TEXT,

    CONSTRAINT "node_task_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "action_nodes_node_id_key" ON "public"."action_nodes"("node_id");

-- CreateIndex
CREATE UNIQUE INDEX "conditional_nodes_node_id_key" ON "public"."conditional_nodes"("node_id");

-- AddForeignKey
ALTER TABLE "public"."triggers" ADD CONSTRAINT "triggers_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."nodes" ADD CONSTRAINT "nodes_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_edges" ADD CONSTRAINT "node_edges_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_edges" ADD CONSTRAINT "node_edges_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_edges" ADD CONSTRAINT "node_edges_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_nodes" ADD CONSTRAINT "action_nodes_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conditional_nodes" ADD CONSTRAINT "conditional_nodes_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."executions" ADD CONSTRAINT "executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."executions" ADD CONSTRAINT "executions_trigger_id_fkey" FOREIGN KEY ("trigger_id") REFERENCES "public"."triggers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_execution_logs" ADD CONSTRAINT "node_execution_logs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_execution_logs" ADD CONSTRAINT "node_execution_logs_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_task_logs" ADD CONSTRAINT "node_task_logs_node_log_id_fkey" FOREIGN KEY ("node_log_id") REFERENCES "public"."node_execution_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_task_logs" ADD CONSTRAINT "node_task_logs_actionNodeId_fkey" FOREIGN KEY ("actionNodeId") REFERENCES "public"."action_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_task_logs" ADD CONSTRAINT "node_task_logs_conditionalNodeId_fkey" FOREIGN KEY ("conditionalNodeId") REFERENCES "public"."conditional_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
