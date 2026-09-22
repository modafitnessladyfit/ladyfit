-- ============================================================
-- LADYFIT — Remove políticas antigas que referenciam private.is_admin()
-- Execute no Supabase: SQL Editor > New Query > Run All
-- ============================================================

drop policy if exists "ladyfit_admin_asset_delete" on storage.objects;
drop policy if exists "ladyfit_admin_asset_insert" on storage.objects;
drop policy if exists "ladyfit_admin_asset_update" on storage.objects;
drop policy if exists "ladyfit_public_asset_read"  on storage.objects;

-- Remove também a função is_admin que criámos antes (já não é necessária)
drop function if exists public.is_admin();
