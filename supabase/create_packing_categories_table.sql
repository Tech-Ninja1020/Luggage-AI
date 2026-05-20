create table public.packing_categories (
  id uuid primary key default gen_random_uuid(),

  packing_list_id uuid not null references public.packing_lists(id) on delete cascade,

  name text not null,
  sort_order int not null default 0,
  is_custom boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint packing_categories_sort_order_nonnegative
    check (sort_order >= 0)
);