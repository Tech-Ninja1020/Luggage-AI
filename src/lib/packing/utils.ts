import type { PackingCategoryWithItems, PackingItemRow } from "@/lib/types/packing";
import type { TripListItem } from "@/lib/types/trips";

export function tripPackingProgress(
  packingLists: TripListItem["packing_lists"] | undefined
): { packed: number; total: number; percent: number } {
  const items = (packingLists ?? []).flatMap((list) =>
    (list.packing_categories ?? []).flatMap((cat) => cat.packing_items ?? [])
  );
  const total = items.length;
  const packed = items.filter((i) => i.is_packed).length;
  const percent = total === 0 ? 0 : Math.round((packed / total) * 100);
  return { packed, total, percent };
}

export function categoryProgress(category: PackingCategoryWithItems): {
  packed: number;
  total: number;
  percent: number;
} {
  const total = category.packing_items.length;
  const packed = category.packing_items.filter((i) => i.is_packed).length;
  const percent = total === 0 ? 0 : Math.round((packed / total) * 100);
  return { packed, total, percent };
}

export function listProgress(categories: PackingCategoryWithItems[]): {
  packed: number;
  total: number;
  percent: number;
} {
  const items = categories.flatMap((c) => c.packing_items);
  const total = items.length;
  const packed = items.filter((i) => i.is_packed).length;
  const percent = total === 0 ? 0 : Math.round((packed / total) * 100);
  return { packed, total, percent };
}

export function sortCategories(
  categories: PackingCategoryWithItems[]
): PackingCategoryWithItems[] {
  return [...categories].sort((a, b) => a.sort_order - b.sort_order);
}

export function sortItems(items: PackingItemRow[]): PackingItemRow[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
