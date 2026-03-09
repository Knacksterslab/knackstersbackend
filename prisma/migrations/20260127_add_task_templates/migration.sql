-- CreateTable
CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_template_items" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "estimated_minutes" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_templates_created_by_idx" ON "task_templates"("created_by");

-- CreateIndex
CREATE INDEX "task_templates_category_idx" ON "task_templates"("category");

-- CreateIndex
CREATE INDEX "task_template_items_template_id_idx" ON "task_template_items"("template_id");

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_items" ADD CONSTRAINT "task_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
