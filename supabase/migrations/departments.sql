do $$ begin
  create type public.crm_customer_status as enum ('lead', 'cliente', 'inactivo');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.crm_deal_stage as enum ('prospeccion', 'propuesta', 'ganado', 'perdido');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.inventory_movement_type as enum ('entrada', 'salida', 'ajuste');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.finance_transaction_type as enum ('ingreso', 'gasto');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.finance_invoice_status as enum ('borrador', 'emitida', 'pagada', 'vencida');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.hr_leave_type as enum ('vacaciones', 'baja_medica', 'personal');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.hr_leave_status as enum ('pendiente', 'aprobado', 'rechazado');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.ops_project_status as enum ('planificacion', 'en_progreso', 'pausado', 'completado');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.ops_task_priority as enum ('baja', 'media', 'alta', 'urgente');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.ops_task_status as enum ('pendiente', 'en_progreso', 'revision', 'completado');
exception when duplicate_object then null; end $$;

create table if not exists public.crm_customers (
  id uuid primary key default gen_random_uuid(), name text not null, email text, phone text,
  company text, status public.crm_customer_status not null default 'lead',
  created_at timestamptz not null default timezone('utc', now()), created_by uuid not null references auth.users(id) on delete restrict
);
create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.crm_customers(id) on delete cascade,
  title text not null, value numeric(14,2) not null default 0 check (value >= 0),
  stage public.crm_deal_stage not null default 'prospeccion', expected_close_date date,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_categories (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text
);
create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid(), category_id uuid references public.inventory_categories(id) on delete set null,
  sku text not null unique, name text not null, description text, price numeric(14,2) not null default 0 check (price >= 0),
  cost numeric(14,2) not null default 0 check (cost >= 0), stock_quantity integer not null default 0, min_stock_alert integer not null default 0 check (min_stock_alert >= 0)
);
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.inventory_products(id) on delete cascade,
  type public.inventory_movement_type not null, quantity integer not null check (quantity > 0), reason text,
  user_id uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(), type public.finance_transaction_type not null, amount numeric(14,2) not null check (amount > 0),
  category text not null, description text, date date not null default current_date, created_by uuid not null references auth.users(id) on delete restrict
);
create table if not exists public.finance_invoices (
  id uuid primary key default gen_random_uuid(), invoice_number text not null unique,
  customer_id uuid references public.crm_customers(id) on delete set null, issue_date date not null default current_date,
  due_date date not null, subtotal numeric(14,2) not null check (subtotal >= 0), tax_amount numeric(14,2) not null check (tax_amount >= 0),
  total numeric(14,2) not null check (total >= 0), status public.finance_invoice_status not null default 'borrador'
);

create table if not exists public.hr_attendance (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  clock_in timestamptz not null, clock_out timestamptz, notes text
);
create table if not exists public.hr_leaves (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type public.hr_leave_type not null, start_date date not null, end_date date not null,
  status public.hr_leave_status not null default 'pendiente', reviewed_by uuid references auth.users(id) on delete set null,
  check (end_date >= start_date)
);

create table if not exists public.ops_projects (
  id uuid primary key default gen_random_uuid(), name text not null, description text,
  status public.ops_project_status not null default 'planificacion', start_date date, end_date date
);
create table if not exists public.ops_tasks (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.ops_projects(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null, title text not null, description text,
  priority public.ops_task_priority not null default 'media', status public.ops_task_status not null default 'pendiente', due_date date
);

create index if not exists crm_customers_status_idx on public.crm_customers(status);
create index if not exists crm_customers_created_by_idx on public.crm_customers(created_by);
create index if not exists crm_deals_stage_idx on public.crm_deals(stage);
create index if not exists crm_deals_customer_idx on public.crm_deals(customer_id);
create index if not exists inventory_products_category_idx on public.inventory_products(category_id);
create index if not exists inventory_movements_product_idx on public.inventory_movements(product_id);
create index if not exists finance_transactions_date_idx on public.finance_transactions(date);
create index if not exists finance_invoices_status_idx on public.finance_invoices(status);
create index if not exists hr_attendance_user_clock_idx on public.hr_attendance(user_id, clock_in);
create index if not exists hr_leaves_user_status_idx on public.hr_leaves(user_id, status);
create index if not exists ops_tasks_project_idx on public.ops_tasks(project_id);
create index if not exists ops_tasks_assigned_idx on public.ops_tasks(assigned_to);

create or replace function public.has_department_access(required_department text, record_user uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role in ('administrador', 'manager') or (p.role = 'empleado' and p.department = required_department and (record_user is null or record_user = auth.uid())))
  );
$$;

create or replace function public.is_manager_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('administrador', 'manager'));
$$;

revoke all on function public.has_department_access(text, uuid) from public;
revoke all on function public.is_manager_or_admin() from public;
grant execute on function public.has_department_access(text, uuid) to authenticated;
grant execute on function public.is_manager_or_admin() to authenticated;

create or replace function public.adjust_inventory_stock(
  p_product_id uuid,
  p_quantity integer,
  p_type public.inventory_movement_type,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_stock integer;
  next_stock integer;
begin
  if not public.has_department_access('inventory', auth.uid()) then
    raise exception 'Sin acceso al inventario';
  end if;

  if p_quantity <= 0 then
    raise exception 'La cantidad debe ser positiva';
  end if;

  select stock_quantity into current_stock
  from public.inventory_products
  where id = p_product_id
  for update;

  if current_stock is null then
    raise exception 'Producto no encontrado';
  end if;

  next_stock := case p_type
    when 'entrada' then current_stock + p_quantity
    when 'salida' then current_stock - p_quantity
    when 'ajuste' then p_quantity
  end;

  if next_stock < 0 then
    raise exception 'El stock no puede ser negativo';
  end if;

  update public.inventory_products
  set stock_quantity = next_stock
  where id = p_product_id;

  insert into public.inventory_movements (product_id, type, quantity, reason, user_id)
  values (p_product_id, p_type, p_quantity, p_reason, auth.uid());
end;
$$;

revoke all on function public.adjust_inventory_stock(uuid, integer, public.inventory_movement_type, text) from public;
grant execute on function public.adjust_inventory_stock(uuid, integer, public.inventory_movement_type, text) to authenticated;

alter table public.crm_customers enable row level security;
alter table public.crm_deals enable row level security;
alter table public.inventory_categories enable row level security;
alter table public.inventory_products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_invoices enable row level security;
alter table public.hr_attendance enable row level security;
alter table public.hr_leaves enable row level security;
alter table public.ops_projects enable row level security;
alter table public.ops_tasks enable row level security;

drop policy if exists "CRM department access" on public.crm_customers;
create policy "CRM department access" on public.crm_customers for all to authenticated using (public.has_department_access('crm', created_by)) with check (public.has_department_access('crm', created_by));
drop policy if exists "CRM deals department access" on public.crm_deals;
create policy "CRM deals department access" on public.crm_deals for all to authenticated using (public.has_department_access('crm')) with check (public.has_department_access('crm'));
drop policy if exists "Inventory department access" on public.inventory_categories;
create policy "Inventory department access" on public.inventory_categories for all to authenticated using (public.has_department_access('inventory')) with check (public.has_department_access('inventory'));
drop policy if exists "Inventory products department access" on public.inventory_products;
create policy "Inventory products department access" on public.inventory_products for all to authenticated using (public.has_department_access('inventory')) with check (public.has_department_access('inventory'));
drop policy if exists "Inventory movements department access" on public.inventory_movements;
create policy "Inventory movements department access" on public.inventory_movements for all to authenticated using (public.has_department_access('inventory', user_id)) with check (public.has_department_access('inventory', user_id));
drop policy if exists "Finance department access" on public.finance_transactions;
create policy "Finance department access" on public.finance_transactions for all to authenticated using (public.has_department_access('finance', created_by)) with check (public.has_department_access('finance', created_by));
drop policy if exists "Finance invoices department access" on public.finance_invoices;
create policy "Finance invoices department access" on public.finance_invoices for all to authenticated using (public.has_department_access('finance')) with check (public.has_department_access('finance'));
drop policy if exists "HR attendance access" on public.hr_attendance;
create policy "HR attendance access" on public.hr_attendance for all to authenticated using (public.has_department_access('hr', user_id) or (public.is_manager_or_admin() and user_id is not null)) with check (public.has_department_access('hr', user_id) or public.is_manager_or_admin());
drop policy if exists "HR leaves access" on public.hr_leaves;
create policy "HR leaves access" on public.hr_leaves for all to authenticated using (public.has_department_access('hr', user_id) or (public.is_manager_or_admin() and user_id is not null)) with check (public.has_department_access('hr', user_id) or public.is_manager_or_admin());
drop policy if exists "Operations projects access" on public.ops_projects;
create policy "Operations projects access" on public.ops_projects for all to authenticated using (public.has_department_access('operations')) with check (public.has_department_access('operations'));
drop policy if exists "Operations tasks access" on public.ops_tasks;
create policy "Operations tasks access" on public.ops_tasks for all to authenticated using (public.has_department_access('operations', assigned_to)) with check (public.has_department_access('operations', assigned_to));
