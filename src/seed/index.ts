import { seedNodeCategories } from "./node-category.seed";

export async function seedRunner() {
  try {
    await seedNodeCategories();

    console.log("All seeds applied successfully");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}
