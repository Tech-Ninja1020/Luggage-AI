import { sortCategories, sortItems } from "@/lib/packing/utils";
import { supabase } from "@/lib/supabase";
import type {
  PackingCategoryRow,
  PackingCategoryWithItems,
  PackingItemRow,
  PackingListWithCategories,
} from "@/lib/types/packing";

const PACKING_LIST_SELECT = `
  *,
  packing_categories (
    *,
    packing_items (*)
  )
`;

function normalizeList(raw: PackingListWithCategories): PackingListWithCategories {
  const categories = (raw.packing_categories ?? []).map((cat) => ({
    ...cat,
    packing_items: sortItems(cat.packing_items ?? []),
  }));
  return {
    ...raw,
    packing_categories: sortCategories(categories),
  };
}

export async function fetchPackingListForTrip(
  tripId: string,
  userId: string
): Promise<{ data: PackingListWithCategories | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("packing_lists")
    .select(PACKING_LIST_SELECT)
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  if (!data) {
    return { data: null, error: null };
  }
  return { data: normalizeList(data as PackingListWithCategories), error: null };
}

export async function createPackingListForTrip(
  tripId: string,
  userId: string,
  name = "Packing List"
): Promise<{ data: PackingListWithCategories | null; error: Error | null }> {
  const { data: list, error: listError } = await supabase
    .from("packing_lists")
    .insert({
      trip_id: tripId,
      user_id: userId,
      name,
    })
    .select(PACKING_LIST_SELECT)
    .single();

  if (listError || !list) {
    return {
      data: null,
      error: new Error(listError?.message ?? "Could not create packing list."),
    };
  }
  return { data: normalizeList(list as PackingListWithCategories), error: null };
}

export async function ensurePackingListForTrip(
  tripId: string,
  userId: string,
  name?: string
): Promise<{ data: PackingListWithCategories | null; error: Error | null }> {
  const existing = await fetchPackingListForTrip(tripId, userId);
  if (existing.error) {
    return existing;
  }
  if (existing.data) {
    return existing;
  }

  let listName = name;
  if (!listName) {
    const { data: trip } = await supabase
      .from("trips")
      .select("destination_name, destination_city")
      .eq("id", tripId)
      .eq("user_id", userId)
      .maybeSingle();
    listName = packingListNameFromDestination(
      trip?.destination_name,
      trip?.destination_city
    );
  }

  return createPackingListForTrip(tripId, userId, listName);
}

export async function updatePackingItem(
  itemId: string,
  updates: Partial<Pick<PackingItemRow, "name" | "quantity" | "notes" | "is_packed">>
): Promise<{ data: PackingItemRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("packing_items")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as PackingItemRow, error: null };
}

export async function deletePackingItem(
  itemId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("packing_items").delete().eq("id", itemId);
  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function insertPackingCategory(
  packingListId: string,
  name: string,
  sortOrder: number
): Promise<{ data: PackingCategoryWithItems | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("packing_categories")
    .insert({
      packing_list_id: packingListId,
      name,
      sort_order: sortOrder,
      is_custom: true,
    })
    .select()
    .single();

  if (error || !data) {
    return {
      data: null,
      error: new Error(error?.message ?? "Could not add category."),
    };
  }
  const row = data as PackingCategoryRow;
  return {
    data: { ...row, packing_items: [] },
    error: null,
  };
}

export async function updatePackingCategory(
  categoryId: string,
  updates: Partial<Pick<PackingCategoryRow, "name" | "sort_order">>
): Promise<{ data: PackingCategoryRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("packing_categories")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as PackingCategoryRow, error: null };
}

export async function deletePackingCategory(
  categoryId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("packing_categories")
    .delete()
    .eq("id", categoryId);
  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function insertPackingItem(
  packingCategoryId: string,
  name: string,
  sortOrder: number
): Promise<{ data: PackingItemRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("packing_items")
    .insert({
      packing_category_id: packingCategoryId,
      name,
      quantity: 1,
      notes: null,
      is_packed: false,
      is_custom: true,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as PackingItemRow, error: null };
}

export function packingListNameFromDestination(
  destinationName: string | null | undefined,
  destinationCity: string | null | undefined
): string {
  return (
    destinationName?.trim() ||
    destinationCity?.trim() ||
    "Packing List"
  );
}
