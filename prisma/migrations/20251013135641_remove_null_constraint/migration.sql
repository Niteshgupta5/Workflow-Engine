/*
  Warnings:

  - Made the column `config` on table `nodes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."nodes" ALTER COLUMN "config" SET NOT NULL;
