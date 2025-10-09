-- AlterTable
ALTER TABLE "public"."node_edges" ALTER COLUMN "target_node_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."node_execution_logs" ALTER COLUMN "status" SET DATA TYPE TEXT;
