-- ============================================================
-- LADYFIT — Restringe RLS ao e-mail real do admin (defesa em profundidade)
-- Execute no Supabase: SQL Editor > New Query > Run All
-- ============================================================
-- Até agora, todas as políticas de escrita usavam apenas
-- `auth.role() = 'authenticated'`, ou seja, QUALQUER conta criada no
-- projeto Supabase (mesmo via auto-registo) tinha acesso total de
-- escrita a produtos, pedidos (incluindo dados pessoais de clientes),
-- stock e ficheiros. O auto-registo público já foi desativado no painel
-- do Supabase; este script adiciona uma segunda camada de proteção,
-- restringindo cada política ao e-mail do admin real, mesmo que o
-- auto-registo seja acidentalmente reativado no futuro.

create or replace function is_ladyfit_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(auth.email()) = 'admin@ladyfit.pt';
$$;

grant execute on function is_ladyfit_admin() to authenticated;

-- ── categories, colors, products, product_variants ───────────────────────────
-- Leitura pública mantida (políticas *_select existentes ficam como estão);
-- escrita agora restrita ao admin.

drop policy if exists "categories_auth" on categories;
create policy "categories_admin" on categories
  for all using (is_ladyfit_admin()) with check (is_ladyfit_admin());

drop policy if exists "colors_auth" on colors;
create policy "colors_admin" on colors
  for all using (is_ladyfit_admin()) with check (is_ladyfit_admin());

drop policy if exists "products_auth" on products;
create policy "products_admin" on products
  for all using (is_ladyfit_admin()) with check (is_ladyfit_admin());

drop policy if exists "variants_auth" on product_variants;
create policy "variants_admin" on product_variants
  for all using (is_ladyfit_admin()) with check (is_ladyfit_admin());

-- ── orders, order_items, order_status_history, stock_movements ───────────────
-- Não há leitura pública destas tabelas no site (o comprador nunca vê o seu
-- pedido diretamente) — todo o acesso fica restrito ao admin. A criação de
-- pedidos pelo checkout público continua a funcionar porque usa a chave de
-- serviço (service_role), que ignora RLS.

drop policy if exists "orders_auth_all" on orders;
create policy "orders_admin" on orders
  for all using (is_ladyfit_admin()) with check (is_ladyfit_admin());

drop policy if exists "order_items_auth_all" on order_items;
create policy "order_items_admin" on order_items
  for all using (is_ladyfit_admin()) with check (is_ladyfit_admin());

drop policy if exists "order_status_history_auth_all" on order_status_history;
create policy "order_status_history_admin" on order_status_history
  for all using (is_ladyfit_admin()) with check (is_ladyfit_admin());

drop policy if exists "stock_movements_auth_all" on stock_movements;
create policy "stock_movements_admin" on stock_movements
  for all using (is_ladyfit_admin()) with check (is_ladyfit_admin());

-- ── storage: bucket product-images ────────────────────────────────────────────
-- Leitura pública mantida (img_public_read); escrita restrita ao admin.

drop policy if exists "img_auth_insert" on storage.objects;
create policy "img_admin_insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and is_ladyfit_admin());

drop policy if exists "img_auth_update" on storage.objects;
create policy "img_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and is_ladyfit_admin());

drop policy if exists "img_auth_delete" on storage.objects;
create policy "img_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and is_ladyfit_admin());
