create table public.trips (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  destination_place_id text,
  destination_name text,
  destination_formatted_address text,
  destination_lat double precision,
  destination_lng double precision,
  destination_city text,
  destination_region text,
  destination_country text,
  destination_country_code text,
  destination_timezone text,
  destination_utc_offset_minutes int,

  start_date date,
  end_date date,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);