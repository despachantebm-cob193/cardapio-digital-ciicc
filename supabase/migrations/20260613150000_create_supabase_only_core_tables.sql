-- Fase 8 — Supabase-only core data model
-- Projeto: Cardapio Digital CIICC
-- Escopo: substituir dependencias Firebase/Firestore por tabelas Supabase para cardapio, configuracoes, compradores e vendas.
-- Fora de escopo neste ciclo: migracao de dados reais, Storage, PWA/offline, pagamentos automatizados.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists workplace text,
  add column if not exists shift_hours text,
  add column if not exists photo_url text;

create table if not exists public.store_settings (
  id text primary key default 'default',
  store_name text not null default 'Cardápio Digital',
  whatsapp_number text,
  whatsapp_message text,
  pix_key text,
  updated_at timestamptz not null default now(),
  constraint store_settings_singleton check (id = 'default')
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0,
  category text not null default 'Geral',
  emoji text,
  image_url text,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (length(trim(name)) > 0),
  constraint products_price_non_negative check (price >= 0)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_workplace text,
  customer_shift_hours text,
  customer_photo_url text,
  total_amount numeric(10, 2) not null default 0,
  payment_method text not null,
  created_at timestamptz not null default now(),
  constraint sales_total_non_negative check (total_amount >= 0),
  constraint sales_payment_method_valid check (payment_method in ('later', 'pix'))
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity integer not null,
  price numeric(10, 2) not null default 0,
  emoji text,
  created_at timestamptz not null default now(),
  constraint sale_items_quantity_positive check (quantity > 0),
  constraint sale_items_price_non_negative check (price >= 0)
);

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
before update on public.store_settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

drop policy if exists store_settings_select_authenticated on public.store_settings;
create policy store_settings_select_authenticated
on public.store_settings
for select
to authenticated
using (true);

drop policy if exists store_settings_admin_all on public.store_settings;
create policy store_settings_admin_all
on public.store_settings
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists products_select_authenticated_available_or_admin on public.products;
create policy products_select_authenticated_available_or_admin
on public.products
for select
to authenticated
using (
  available = true
  or public.is_active_admin()
);

drop policy if exists products_admin_all on public.products;
create policy products_admin_all
on public.products
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists sales_insert_own_authenticated on public.sales;
create policy sales_insert_own_authenticated
on public.sales
for insert
to authenticated
with check (
  customer_profile_id in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
      and status = 'active'::public.profile_status
  )
);

drop policy if exists sales_select_own_or_admin on public.sales;
create policy sales_select_own_or_admin
on public.sales
for select
to authenticated
using (
  public.is_active_admin()
  or customer_profile_id in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

drop policy if exists sale_items_insert_for_own_sale on public.sale_items;
create policy sale_items_insert_for_own_sale
on public.sale_items
for insert
to authenticated
with check (
  sale_id in (
    select sales.id
    from public.sales
    join public.profiles on profiles.id = sales.customer_profile_id
    where profiles.auth_user_id = auth.uid()
      and profiles.status = 'active'::public.profile_status
  )
);

drop policy if exists sale_items_select_own_or_admin on public.sale_items;
create policy sale_items_select_own_or_admin
on public.sale_items
for select
to authenticated
using (
  public.is_active_admin()
  or sale_id in (
    select sales.id
    from public.sales
    join public.profiles on profiles.id = sales.customer_profile_id
    where profiles.auth_user_id = auth.uid()
  )
);

grant select on public.store_settings to authenticated;
grant select on public.products to authenticated;
grant insert, select on public.sales to authenticated;
grant insert, select on public.sale_items to authenticated;

insert into public.store_settings (id, store_name)
values ('default', 'Cardápio Digital')
on conflict (id) do nothing;

comment on table public.store_settings is 'Configuracoes globais do Cardapio Digital CIICC em Supabase.';
comment on table public.products is 'Produtos do cardapio migrados para Supabase.';
comment on table public.sales is 'Vendas/comandas registradas no Supabase.';
comment on table public.sale_items is 'Itens das vendas/comandas registradas no Supabase.';
