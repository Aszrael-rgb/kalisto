do $$ begin create type public.lead_stage as enum ('prospeccion', 'negociacion', 'cierre'); exception when duplicate_object then null; end $$;
do $$ begin create type public.quote_status as enum ('borrador', 'enviada', 'aceptada', 'rechazada'); exception when duplicate_object then null; end $$;
do $$ begin create type public.interaction_type as enum ('llamada', 'email', 'reunion', 'nota'); exception when duplicate_object then null; end $$;
do $$ begin create type public.stock_movement_type as enum ('entrada', 'salida'); exception when duplicate_object then null; end $$;
do $$ begin create type public.campaign_status as enum ('borrador', 'activa', 'pausada', 'finalizada'); exception when duplicate_object then null; end $$;

create table if not exists public.system_settings (
  key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default timezone('utc', now()), updated_by uuid references auth.users(id)
);
create table if not exists public.system_audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid not null references auth.users(id), action text not null, entity text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(), name text not null, email text, phone text, company text, stage public.lead_stage not null default 'prospeccion', source text, assigned_to uuid references auth.users(id), created_at timestamptz not null default timezone('utc', now()), created_by uuid not null references auth.users(id)
);
create table if not exists public.crm_quotes (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.crm_customers(id) on delete cascade, quote_number text not null unique, subtotal numeric(14,2) not null check (subtotal >= 0), tax_amount numeric(14,2) not null check (tax_amount >= 0), total numeric(14,2) not null check (total >= 0), status public.quote_status not null default 'borrador', created_at timestamptz not null default timezone('utc', now()), created_by uuid not null references auth.users(id)
);
create table if not exists public.crm_interactions (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.crm_customers(id) on delete cascade, type public.interaction_type not null, notes text not null, occurred_at timestamptz not null default timezone('utc', now()), created_by uuid not null references auth.users(id)
);

create table if not exists public.inv_suppliers (
  id uuid primary key default gen_random_uuid(), name text not null, email text, phone text, created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.inv_products (
  id uuid primary key default gen_random_uuid(), sku text not null unique, name text not null, description text, supplier_id uuid references public.inv_suppliers(id) on delete set null, stock_actual integer not null default 0, stock_minimo integer not null default 0 check (stock_minimo >= 0), unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0)
);
create table if not exists public.inv_movements (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.inv_products(id) on delete cascade, supplier_id uuid references public.inv_suppliers(id) on delete set null, type public.stock_movement_type not null, quantity integer not null check (quantity > 0), notes text, created_by uuid not null references auth.users(id), created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.fin_transactions (
  id uuid primary key default gen_random_uuid(), type public.finance_transaction_type not null, amount numeric(14,2) not null check (amount > 0), category text not null, description text, transaction_date date not null default current_date, created_by uuid not null references auth.users(id)
);
create table if not exists public.fin_invoices (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.crm_customers(id) on delete set null, invoice_number text not null unique, subtotal numeric(14,2) not null check (subtotal >= 0), tax_amount numeric(14,2) not null check (tax_amount >= 0), total numeric(14,2) not null check (total >= 0), status public.finance_invoice_status not null default 'borrador', issued_at date not null default current_date, due_date date not null, created_by uuid not null references auth.users(id)
);

create table if not exists public.hr_employees_data (
  user_id uuid primary key references auth.users(id) on delete cascade, job_title text, phone text, start_date date, emergency_contact text, updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.ops_milestones (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.ops_projects(id) on delete cascade, name text not null, due_date date, completed boolean not null default false
);
create table if not exists public.mkt_campaigns (
  id uuid primary key default gen_random_uuid(), name text not null, budget numeric(14,2) not null default 0 check (budget >= 0), platform text not null, status public.campaign_status not null default 'borrador', created_by uuid not null references auth.users(id), created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.mkt_performance (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.mkt_campaigns(id) on delete cascade, leads_count integer not null default 0 check (leads_count >= 0), conversions_count integer not null default 0 check (conversions_count >= 0), spend numeric(14,2) not null default 0 check (spend >= 0), measured_at date not null default current_date
);

alter table public.profiles drop constraint if exists profiles_department_check;
alter table public.profiles add constraint profiles_department_check check (department is null or department in ('crm', 'inventory', 'finance', 'hr', 'operations', 'marketing'));

create index if not exists crm_leads_stage_idx on public.crm_leads(stage);
create index if not exists crm_quotes_customer_idx on public.crm_quotes(customer_id);
create index if not exists crm_interactions_customer_idx on public.crm_interactions(customer_id);
create index if not exists inv_products_sku_idx on public.inv_products(sku);
create index if not exists inv_movements_product_idx on public.inv_movements(product_id);
create index if not exists fin_transactions_date_idx on public.fin_transactions(transaction_date);
create index if not exists system_audit_created_idx on public.system_audit_logs(created_at desc);
create index if not exists ops_milestones_project_idx on public.ops_milestones(project_id);
create index if not exists mkt_performance_campaign_idx on public.mkt_performance(campaign_id);

create or replace function public.audit_change(action_name text, entity_name text, entity_uuid uuid, details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin insert into public.system_audit_logs(actor_id, action, entity, entity_id, metadata) values (auth.uid(), action_name, entity_name, entity_uuid, details); end;
$$;

alter table public.system_settings enable row level security;
alter table public.system_audit_logs enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_quotes enable row level security;
alter table public.crm_interactions enable row level security;
alter table public.inv_suppliers enable row level security;
alter table public.inv_products enable row level security;
alter table public.inv_movements enable row level security;
alter table public.fin_transactions enable row level security;
alter table public.fin_invoices enable row level security;
alter table public.hr_employees_data enable row level security;
alter table public.ops_milestones enable row level security;
alter table public.mkt_campaigns enable row level security;
alter table public.mkt_performance enable row level security;

create policy "administrators manage settings" on public.system_settings for all to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role = 'administrador')) with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'administrador'));
create policy "administrators read audit" on public.system_audit_logs for select to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role = 'administrador'));
create policy "crm lead department access" on public.crm_leads for all to authenticated using (public.has_department_access('crm', coalesce(assigned_to, created_by))) with check (public.has_department_access('crm', coalesce(assigned_to, created_by)));
create policy "crm quote department access" on public.crm_quotes for all to authenticated using (public.has_department_access('crm', created_by)) with check (public.has_department_access('crm', created_by));
create policy "crm interaction department access" on public.crm_interactions for all to authenticated using (public.has_department_access('crm', created_by)) with check (public.has_department_access('crm', created_by));
create policy "inventory supplier access" on public.inv_suppliers for all to authenticated using (public.has_department_access('inventory')) with check (public.has_department_access('inventory'));
create policy "inventory product access" on public.inv_products for all to authenticated using (public.has_department_access('inventory')) with check (public.has_department_access('inventory'));
create policy "inventory movement access" on public.inv_movements for all to authenticated using (public.has_department_access('inventory', created_by)) with check (public.has_department_access('inventory', created_by));
create policy "finance transaction access" on public.fin_transactions for all to authenticated using (public.has_department_access('finance', created_by)) with check (public.has_department_access('finance', created_by));
create policy "finance invoice access" on public.fin_invoices for all to authenticated using (public.has_department_access('finance', created_by)) with check (public.has_department_access('finance', created_by));
create policy "employee data self or management" on public.hr_employees_data for all to authenticated using (user_id = auth.uid() or public.is_manager_or_admin()) with check (user_id = auth.uid() or public.is_manager_or_admin());
create policy "operations milestone access" on public.ops_milestones for all to authenticated using (public.has_department_access('operations')) with check (public.has_department_access('operations'));
create policy "marketing department access" on public.mkt_campaigns for all to authenticated using (public.has_department_access('crm', created_by)) with check (public.has_department_access('crm', created_by));
create policy "marketing performance access" on public.mkt_performance for all to authenticated using (exists (select 1 from public.mkt_campaigns c where c.id = campaign_id)) with check (exists (select 1 from public.mkt_campaigns c where c.id = campaign_id));
