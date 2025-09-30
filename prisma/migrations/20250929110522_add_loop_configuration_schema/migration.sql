-- CreateTable
CREATE TABLE "public"."loop_configurations" (
    "id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "loop_type" TEXT NOT NULL,
    "max_iterations" INTEGER,
    "exit_condition" TEXT,
    "data_source_path" TEXT,

    CONSTRAINT "loop_configurations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."loop_configurations" ADD CONSTRAINT "loop_configurations_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
