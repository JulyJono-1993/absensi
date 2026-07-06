-- ============================================
-- Users / Admin Schema for EduAttend
-- Jalankan di SQL Editor Supabase
-- ============================================

create table if not exists profiles (
  id uuid references auth.users not null primary key,
  username text not null unique,
  full_name text,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.email),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'admin'),
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update trigger untuk updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- Sample Admin Users
-- Ganti email sesuai kebutuhan, lalu jalankan:
-- Auth -> Users -> Create User -> isi email + password
-- atau pakai Supabase Auth REST API untuk membuat user
-- ============================================

-- Contoh data users (setelah user dibuat via Supabase Auth, isi email di sini)
-- insert into profiles (id, username, full_name, role, is_active)
-- values
--   ('UUID-USER-1', 'admin01', 'Administrator Satu', 'admin', true),
--   ('UUID-USER-2', 'admin02', 'Administrator Dua', 'admin', true);
