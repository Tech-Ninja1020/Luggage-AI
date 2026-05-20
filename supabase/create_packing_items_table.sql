create table public.packing_items (
  id uuid primary key default gen_random_uuid(),

  packing_category_id uuid not null references public.packing_categories(id) on delete cascade,

  name text not null,
  quantity int not null default 1,
  notes text,
  is_packed boolean not null default false,
  is_custom boolean not null default false,
  sort_order int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint packing_items_quantity_positive
    check (quantity > 0),

  constraint packing_items_sort_order_nonnegative
    check (sort_order >= 0)
);