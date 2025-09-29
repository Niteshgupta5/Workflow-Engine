-- AlterTable
ALTER TABLE "public"."node_execution_logs" ALTER COLUMN "data" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."node_task_logs" ALTER COLUMN "data" DROP NOT NULL;
