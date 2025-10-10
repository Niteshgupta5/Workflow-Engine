-- CreateTable
CREATE TABLE "public"."data_transformation_nodes" (
    "id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "transformation_type" TEXT NOT NULL,
    "transform_rules" JSONB,

    CONSTRAINT "data_transformation_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_transformation_nodes_node_id_key" ON "public"."data_transformation_nodes"("node_id");

-- AddForeignKey
ALTER TABLE "public"."data_transformation_nodes" ADD CONSTRAINT "data_transformation_nodes_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
