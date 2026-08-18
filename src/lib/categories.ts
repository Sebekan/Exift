import type { Category, CategoryId } from "@/types";
import categoriesData from "@/data/categories.json";

export const categories = categoriesData as Category[];

export function getCategoryLabel(id: CategoryId): string {
  return categories.find((c) => c.id === id)?.label ?? id;
}
