/*
  Warnings:

  - You are about to drop the column `category_id` on the `nodes` table. All the data in the column will be lost.
  - You are about to drop the `action_nodes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conditional_nodes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `configurations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `data_transformation_nodes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `node_edges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `node_task_logs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `template_id` to the `nodes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."action_nodes" DROP CONSTRAINT "action_nodes_node_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."conditional_nodes" DROP CONSTRAINT "conditional_nodes_node_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."configurations" DROP CONSTRAINT "configurations_node_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."data_transformation_nodes" DROP CONSTRAINT "data_transformation_nodes_node_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."node_edges" DROP CONSTRAINT "node_edges_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."node_edges" DROP CONSTRAINT "node_edges_source_node_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."node_edges" DROP CONSTRAINT "node_edges_target_node_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."node_edges" DROP CONSTRAINT "node_edges_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."node_task_logs" DROP CONSTRAINT "node_task_logs_node_log_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."nodes" DROP CONSTRAINT "nodes_category_id_fkey";

-- AlterTable
ALTER TABLE "public"."nodes" DROP COLUMN "category_id",
ADD COLUMN     "template_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."action_nodes";

-- DropTable
DROP TABLE "public"."conditional_nodes";

-- DropTable
DROP TABLE "public"."configurations";

-- DropTable
DROP TABLE "public"."data_transformation_nodes";

-- DropTable
DROP TABLE "public"."node_edges";

-- DropTable
DROP TABLE "public"."node_task_logs";

-- CreateTable
CREATE TABLE "public"."node_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category_id" TEXT,

    CONSTRAINT "node_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."edges" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "group_id" TEXT,
    "condition" TEXT,
    "expression" TEXT,

    CONSTRAINT "edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "node_templates_name_key" ON "public"."node_templates"("name");

-- AddForeignKey
ALTER TABLE "public"."nodes" ADD CONSTRAINT "nodes_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."node_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_templates" ADD CONSTRAINT "node_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."node_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."edges" ADD CONSTRAINT "edges_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."edges" ADD CONSTRAINT "edges_source_fkey" FOREIGN KEY ("source") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."edges" ADD CONSTRAINT "edges_target_fkey" FOREIGN KEY ("target") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."edges" ADD CONSTRAINT "edges_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
