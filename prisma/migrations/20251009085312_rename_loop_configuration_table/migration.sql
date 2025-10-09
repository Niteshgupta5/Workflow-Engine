/*
  Warnings:

  - You are about to drop the `loop_configurations` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `target_node_id` on table `node_edges` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."loop_configurations" DROP CONSTRAINT "loop_configurations_node_id_fkey";

-- AlterTable
ALTER TABLE "public"."node_edges" ALTER COLUMN "target_node_id" SET NOT NULL;

-- DropTable
DROP TABLE "public"."loop_configurations";

-- CreateTable
CREATE TABLE "public"."configurations" (
    "id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "loop_type" TEXT,
    "max_iterations" INTEGER,
    "exit_condition" TEXT,
    "data_source_path" TEXT,
    "switch_cases" JSONB,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."configurations" ADD CONSTRAINT "configurations_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
