import { prisma } from "../config";
import { NODE_CATEGORIES } from "./data";

const SEED_NAME = "NodeCategorySeed";
const SEED_VERSION = 1;

export async function seedNodeCategories() {
  const existing = await prisma.seed.findUnique({ where: { name: SEED_NAME } });
  if (existing && existing.version >= SEED_VERSION) {
    console.log(`${SEED_NAME} already applied with current version`);
    return;
  }

  for (const category of NODE_CATEGORIES) {
    await prisma.nodeCategory.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
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
