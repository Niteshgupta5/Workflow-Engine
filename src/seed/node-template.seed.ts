import { prisma } from "../config";
import { NodeCategoryType } from "../types";
import { NODE_CATEGORIES, NODE_TEMPLATES } from "./data";

const SEED_NAME = "NodeTemplateSeed";
const SEED_VERSION = 3;

export async function seedNodeTemplates() {
  const existing = await prisma.seed.findUnique({ where: { name: SEED_NAME } });
  if (existing && existing.version >= SEED_VERSION) {
    console.log(`${SEED_NAME} already applied with current version`);
    return;
  }
  const categoryMap = new Map<NodeCategoryType, string>();
  NODE_CATEGORIES.forEach((category) => {
    categoryMap.set(category.name as NodeCategoryType, category.id);
  });

  for (const template of NODE_TEMPLATES) {
    const categoryId = categoryMap.get(template.category);
    if (!categoryId) throw new Error(`Category not found for ${template.name}`);
    const data = {
      name: template.name,
      description: template.description,
      type: template.type,
      category_id: categoryId,
    };
    await prisma.nodeTemplate.upsert({
      where: { name: data.name },
      update: { description: data.description, type: template.type, category_id: categoryId },
      create: { ...data },
    });
  }

  // Update the seed table
  await prisma.seed.upsert({
    where: { name: SEED_NAME },
    update: { version: SEED_VERSION, appliedAt: new Date() },
    create: { name: SEED_NAME, version: SEED_VERSION },
  });

  console.log(`${SEED_NAME} applied successfully`);
}
