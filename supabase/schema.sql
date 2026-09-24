create type public.user_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

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
  );

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
