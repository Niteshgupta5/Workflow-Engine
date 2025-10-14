import { seedNodeCategories } from "./node-category.seed";
import { seedNodeTemplates } from "./node-template.seed";

export async function seedRunner() {
  try {
    await seedNodeCategories();
    await seedNodeTemplates();

    console.log("All seeds applied successfully");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}
