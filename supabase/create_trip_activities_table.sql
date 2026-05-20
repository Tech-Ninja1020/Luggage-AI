create table public.trip_activities (
  id uuid primary key default gen_random_uuid(),

  trip_id uuid not null references public.trips(id) on delete cascade,
  activity_id uuid not null references public.activity_options(id) on delete cascade,

  created_at timestamptz not null default now(),

  unique (trip_id, activity_id)
);