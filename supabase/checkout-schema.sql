-- ============================================================
-- LADYFIT — Checkout, número de pedido e movimentos de stock
-- Execute no Supabase: SQL Editor > New Query > Run All
-- (requer que supabase/orders-schema.sql já tenha sido executado)
-- ============================================================

-- 1. Atualiza o fluxo de status dos pedidos
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('whatsapp_iniciado','em_negociacao','confirmado','pago','enviado','concluido','cancelado'));

-- 2. Número de pedido no formato LF-AAAA-NNNNNN
alter table orders add column if not exists order_number text unique;

create or replace function set_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null then
    new.order_number := 'LF-' || to_char(new.created_at, 'YYYY') || '-' || lpad(new.id::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_order_number on orders;
create trigger trg_set_order_number
  before insert on orders
  for each row execute function set_order_number();

-- Preenche o número para pedidos já existentes sem ele
update orders
set order_number = 'LF-' || to_char(created_at, 'YYYY') || '-' || lpad(id::text, 6, '0')
where order_number is null;

-- 3. Movimentos de stock (baixa automática, reversão e ajuste manual = auditoria)
create table if not exists stock_movements (
  id            text primary key,
  variant_id    text not null references product_variants(id) on delete cascade,
  order_id      bigint references orders(id) on delete set null,
  quantity_delta integer not null,
  reason        text not null,
  source        text not null check (source in ('order_confirmed','manual','reversal')),
  created_at    timestamptz not null default now()
);

alter table stock_movements enable row level security;

create policy "stock_movements_auth_all" on stock_movements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on stock_movements to authenticated;
