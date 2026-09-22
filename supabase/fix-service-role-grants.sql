-- ============================================================
-- LADYFIT — Grants para service_role (usado pelo checkout público)
-- Execute no Supabase: SQL Editor > New Query > Run All
-- ============================================================
-- A checkout-server.ts usa a chave de serviço do Supabase para criar
-- pedidos em nome de visitantes não autenticados (bypassa RLS). Tal como
-- aconteceu com "anon" no storage, este projeto exige GRANT explícito
-- mesmo para service_role.

grant select on products         to service_role;
grant select on product_variants to service_role;
grant select on colors           to service_role;

grant select, insert on orders               to service_role;
grant select, insert on order_items          to service_role;
grant select, insert on order_status_history to service_role;

grant usage, select on sequence orders_id_seq to service_role;
