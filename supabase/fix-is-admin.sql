-- ============================================================
-- LADYFIT — Correcção: função is_admin em falta
-- Execute no Supabase: SQL Editor > New Query > Run All
-- ============================================================

-- Cria a função is_admin que políticas internas do storage referenciam.
-- Retorna true para qualquer utilizador autenticado (é suficiente para
-- este projecto — não há multi-tenant nem roles diferenciados).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.role() = 'authenticated';
$$;

-- Garante que a função é acessível pelos roles do Supabase
grant execute on function public.is_admin() to anon, authenticated, service_role;
