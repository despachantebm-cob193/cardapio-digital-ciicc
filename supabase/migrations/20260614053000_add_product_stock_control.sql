alter table public.products
  add column if not exists stock_initial integer not null default 0,
  add column if not exists stock_available integer not null default 0,
  add column if not exists cost_price numeric(10, 2) not null default 0,
  add column if not exists lifecycle_type text not null default 'industrial',
  add column if not exists cycle_started_at timestamptz not null default now(),
  add column if not exists cycle_closed_at timestamptz,
  add column if not exists cycle_unsold_quantity integer not null default 0;

update public.products
set
  stock_initial = greatest(coalesce(stock_initial, 0), 0),
  stock_available = greatest(coalesce(stock_available, 0), 0),
  cost_price = greatest(coalesce(cost_price, 0), 0),
  lifecycle_type = case
    when lifecycle_type in ('same_day', 'industrial') then lifecycle_type
    else 'industrial'
  end,
  cycle_started_at = coalesce(cycle_started_at, now()),
  cycle_unsold_quantity = greatest(coalesce(cycle_unsold_quantity, 0), 0);

alter table public.products
  drop constraint if exists products_stock_initial_non_negative,
  drop constraint if exists products_stock_available_non_negative,
  drop constraint if exists products_cost_price_non_negative,
  drop constraint if exists products_cycle_unsold_non_negative,
  drop constraint if exists products_lifecycle_type_valid;

alter table public.products
  add constraint products_stock_initial_non_negative check (stock_initial >= 0),
  add constraint products_stock_available_non_negative check (stock_available >= 0),
  add constraint products_cost_price_non_negative check (cost_price >= 0),
  add constraint products_cycle_unsold_non_negative check (cycle_unsold_quantity >= 0),
  add constraint products_lifecycle_type_valid check (lifecycle_type in ('same_day', 'industrial'));

create or replace function public.create_sale_with_stock(
  p_customer_profile_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_workplace text,
  p_customer_shift_hours text,
  p_customer_photo_url text,
  p_total_amount numeric,
  p_payment_method text,
  p_payment_proof_url text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $create_sale_with_stock$
declare
  v_sale_id uuid;
  v_item record;
  v_updated integer;
begin
  if p_payment_method not in ('later', 'pix') then
    raise exception 'Invalid payment method.';
  end if;

  if not (
    public.is_active_admin()
    or exists (
      select 1
      from public.profiles
      where id = p_customer_profile_id
        and auth_user_id = auth.uid()
        and status = 'active'::public.profile_status
    )
  ) then
    raise exception 'Customer is not allowed to register sale.';
  end if;

  insert into public.sales (
    customer_profile_id,
    customer_name,
    customer_email,
    customer_workplace,
    customer_shift_hours,
    customer_photo_url,
    total_amount,
    payment_method,
    payment_proof_url
  )
  values (
    p_customer_profile_id,
    p_customer_name,
    p_customer_email,
    p_customer_workplace,
    p_customer_shift_hours,
    p_customer_photo_url,
    p_total_amount,
    p_payment_method,
    p_payment_proof_url
  )
  returning id into v_sale_id;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      product_id uuid,
      name text,
      quantity integer,
      price numeric,
      emoji text
    )
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Invalid quantity for product %.', coalesce(v_item.name, 'unnamed');
    end if;

    if v_item.product_id is not null then
      update public.products
      set
        stock_available = stock_available - v_item.quantity,
        available = case
          when stock_available - v_item.quantity > 0 then available
          else false
        end,
        updated_at = now()
      where id = v_item.product_id
        and available = true
        and cycle_closed_at is null
        and stock_available >= v_item.quantity;

      get diagnostics v_updated = row_count;

      if v_updated = 0 then
        raise exception 'Insufficient stock or unavailable product: %.', coalesce(v_item.name, v_item.product_id::text);
      end if;
    end if;

    insert into public.sale_items (
      sale_id,
      product_id,
      name,
      quantity,
      price,
      emoji
    )
    values (
      v_sale_id,
      v_item.product_id,
      coalesce(v_item.name, 'Produto'),
      v_item.quantity,
      coalesce(v_item.price, 0),
      coalesce(v_item.emoji, 'item')
    );
  end loop;

  return v_sale_id;
end;
$create_sale_with_stock$;

grant execute on function public.create_sale_with_stock(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  text,
  text,
  jsonb
) to authenticated;

comment on column public.products.stock_initial is
  'Initial quantity informed in stock control.';

comment on column public.products.stock_available is
  'Current available quantity for customer menu.';

comment on column public.products.cost_price is
  'Unit cost used for margin calculation.';

comment on column public.products.lifecycle_type is
  'Product lifecycle type: same_day or industrial.';

comment on column public.products.cycle_started_at is
  'Timestamp when the product sale cycle was started.';

comment on column public.products.cycle_closed_at is
  'Timestamp when the sale cycle was closed.';

comment on column public.products.cycle_unsold_quantity is
  'Unsold quantity informed when closing the cycle.';
