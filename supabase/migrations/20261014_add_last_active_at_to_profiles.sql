-- 1. Add last_active_at tracking column to public.profiles
alter table public.profiles
add column if not exists last_active_at timestamptz not null default now();

-- 2. Index for fast verification during Quick Login
create index if not exists idx_profiles_id_last_active
on public.profiles (id, last_active_at);
