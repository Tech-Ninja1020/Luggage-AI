export type PackingListRow = {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type PackingCategoryRow = {
  id: string;
  packing_list_id: string;
  name: string;
  sort_order: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
};

export type PackingItemRow = {
  id: string;
  packing_category_id: string;
  name: string;
  quantity: number;
  notes: string | null;
  is_packed: boolean;
  is_custom: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PackingCategoryWithItems = PackingCategoryRow & {
  packing_items: PackingItemRow[];
};

export type PackingListWithCategories = PackingListRow & {
  packing_categories: PackingCategoryWithItems[];
};
