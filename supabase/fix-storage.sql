-- ============================================================
-- LADYFIT — Correcção completa de Storage
-- Execute no Supabase: SQL Editor > New Query > Run All
-- ============================================================

-- 1. Garante que o bucket existe e é público
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,   -- 10 MB por ficheiro
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Remove políticas antigas se existirem (evita conflito)
drop policy if exists "img_public_read"  on storage.objects;
drop policy if exists "img_auth_insert"  on storage.objects;
drop policy if exists "img_auth_delete"  on storage.objects;
drop policy if exists "img_auth_update"  on storage.objects;

-- 3. Recria políticas
create policy "img_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "img_auth_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
  );

create policy "img_auth_update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
  );

create policy "img_auth_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
  );
