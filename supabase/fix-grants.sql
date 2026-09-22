-- ============================================================
-- LADYFIT — Correção de permissões (GRANT)
-- Execute no Supabase: SQL Editor > New Query > Run All
-- ============================================================

-- Leitura pública (loja — role anon e authenticated)
grant select on categories       to anon, authenticated;
grant select on colors           to anon, authenticated;
grant select on products         to anon, authenticated;
grant select on product_variants to anon, authenticated;

-- Escrita apenas para utilizadores autenticados (admin)
grant insert, update, delete on categories       to authenticated;
grant insert, update, delete on colors           to authenticated;
grant insert, update, delete on products         to authenticated;
grant insert, update, delete on product_variants to authenticated;

-- Storage: leitura pública já está configurada via bucket público.
-- Se quiser também garantir via role, descomente:
-- grant usage on schema storage to anon, authenticated;
