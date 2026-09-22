-- ============================================================
-- LADYFIT — Schema de Pedidos (Orders)
-- Execute no Supabase: SQL Editor > New Query > Run All
-- ============================================================

create table if not exists orders (
  id              bigserial primary key,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  customer_name   text not null,
  customer_phone  text not null,
  customer_email  text not null,
  total           numeric(10,2) not null default 0,
  status          text not null default 'whatsapp_iniciado'
                    check (status in ('whatsapp_iniciado','confirmado','pago','enviado','entregue','cancelado')),
  notes           text not null default '',
  stock_deducted  boolean not null default false
);

create table if not exists order_items (
  id            text primary key,
  order_id      bigint not null references orders(id) on delete cascade,
  product_id    text references products(id) on delete set null,
  variant_id    text references product_variants(id) on delete set null,
  product_name  text not null,
  color         text not null default '',
  size          text not null default '',
  quantity      integer not null default 1,
  unit_price    numeric(10,2) not null default 0
);

create table if not exists order_status_history (
  id          text primary key,
  order_id    bigint not null references orders(id) on delete cascade,
  status      text not null,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Pedidos são geridos apenas pela área administrativa (não há checkout
-- público ainda), por isso o acesso fica restrito a utilizadores autenticados.

alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table order_status_history enable row level security;

create policy "orders_auth_all" on orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "order_items_auth_all" on order_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "order_status_history_auth_all" on order_status_history
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ── Grants ───────────────────────────────────────────────────────────────────
-- Necessário além das políticas RLS (ver nota da correção anterior de storage).

grant select, insert, update, delete on orders               to authenticated;
grant select, insert, update, delete on order_items          to authenticated;
grant select, insert, update, delete on order_status_history to authenticated;
grant usage, select on sequence orders_id_seq to authenticated;
