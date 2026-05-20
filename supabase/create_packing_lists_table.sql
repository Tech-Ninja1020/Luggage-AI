create table public.packing_lists (
  id uuid primary key default gen_random_uuid(),

  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null default 'Packing List',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);