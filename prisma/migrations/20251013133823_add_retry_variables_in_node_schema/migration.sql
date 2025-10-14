-- AlterTable
ALTER TABLE "public"."nodes" ADD COLUMN     "retry_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "retry_delay_ms" INTEGER NOT NULL DEFAULT 0;
