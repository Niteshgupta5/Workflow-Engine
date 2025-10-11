-- AlterTable
ALTER TABLE "public"."nodes" ADD COLUMN     "category_id" TEXT;

-- CreateTable
CREATE TABLE "public"."node_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "node_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "node_category_name_key" ON "public"."node_category"("name");

-- AddForeignKey
ALTER TABLE "public"."nodes" ADD CONSTRAINT "nodes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."node_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
