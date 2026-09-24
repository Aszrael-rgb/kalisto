do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'app_role'
  ) then
    create type public.app_role as enum ('administrador', 'manager', 'empleado');
  end if;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'empleado'::public.app_role,
  department text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles
  add column if not exists role public.app_role not null default 'empleado'::public.app_role;

alter table public.profiles
  add column if not exists department text;

alter table public.profiles
  drop constraint if exists profiles_department_check;

alter table public.profiles
  add constraint profiles_department_check
  check (department is null or department in ('crm', 'inventory', 'finance', 'hr', 'operations'));

alter table public.profiles
  alter column role drop default;

do $$
declare
  role_type text;
begin
  select udt_name
  into role_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'role';

  if role_type is not null and role_type <> 'app_role' then
    alter table public.profiles
      alter column role type public.app_role
      using (
        case role::text
          when 'admin' then 'administrador'
          when 'user' then 'empleado'
          else role::text
        end
      )::public.app_role;
  end if;
end;
$$;

alter table public.profiles
  alter column role set default 'empleado'::public.app_role;

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create or replace function public.is_administrator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'administrador'::public.app_role
  );
$$;

revoke all on function public.is_administrator() from public;
grant execute on function public.is_administrator() to authenticated;

drop policy if exists "Administrators can update profiles" on public.profiles;

create policy "Administrators can update profiles"
on public.profiles
for update
to authenticated
using (public.is_administrator())
with check (public.is_administrator());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
