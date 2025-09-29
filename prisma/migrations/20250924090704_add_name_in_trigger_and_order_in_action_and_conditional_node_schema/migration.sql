/*
  Warnings:

  - Added the required column `order` to the `action_nodes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `conditional_nodes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."action_nodes" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."conditional_nodes" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."triggers" ADD COLUMN     "name" TEXT;
