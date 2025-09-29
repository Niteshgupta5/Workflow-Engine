/*
  Warnings:

  - You are about to drop the column `actionNodeId` on the `node_task_logs` table. All the data in the column will be lost.
  - You are about to drop the column `conditionalNodeId` on the `node_task_logs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."node_task_logs" DROP CONSTRAINT "node_task_logs_actionNodeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."node_task_logs" DROP CONSTRAINT "node_task_logs_conditionalNodeId_fkey";

-- AlterTable
ALTER TABLE "public"."node_task_logs" DROP COLUMN "actionNodeId",
DROP COLUMN "conditionalNodeId";
