create table public.activity_options (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete cascade,

  name text not null,
  is_default boolean not null default false,

  created_at timestamptz not null default now(),

  constraint activity_owner_check check (
    is_default = true or user_id is not null
  )
);