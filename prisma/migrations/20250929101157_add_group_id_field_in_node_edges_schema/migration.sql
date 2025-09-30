-- AlterTable
ALTER TABLE "public"."node_edges" ADD COLUMN     "group_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."node_edges" ADD CONSTRAINT "node_edges_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
