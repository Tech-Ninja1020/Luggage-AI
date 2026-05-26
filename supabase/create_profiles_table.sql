create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,

  gender text,
  outfit_preferences text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_user_id_idx on public.profiles (user_id);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid () = user_id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid () = user_id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid () = user_id);
