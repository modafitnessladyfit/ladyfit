-- ============================================================
-- LADYFIT — Schema completo
-- Execute no Supabase: SQL Editor > New Query > Run All
-- ============================================================

-- Tabela: categories
create table if not exists categories (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  name_en     text not null,
  image       text,
  created_at  timestamptz default now()
);

-- Tabela: colors
create table if not exists colors (
  id          text primary key,
  name        text not null,
  name_en     text not null,
  hex         text not null,
  created_at  timestamptz default now()
);

-- Tabela: products
create table if not exists products (
  id              text primary key,
  slug            text not null unique,
  category_id     text references categories(id) on delete set null,
  name            text not null,
  name_en         text not null default '',
  description     text not null default '',
  description_en  text not null default '',
  images          jsonb not null default '[]'::jsonb,
  price           numeric(10,2) not null default 0,
  sale_price      numeric(10,2),
  status          text not null default 'draft' check (status in ('draft','published')),
  bestseller      boolean not null default false,
  is_new          boolean not null default false,
  created_at      timestamptz default now()
);

-- Tabela: product_variants
create table if not exists product_variants (
  id          text primary key,
  product_id  text not null references products(id) on delete cascade,
  color_id    text references colors(id) on delete set null,
  size        text not null,
  stock       integer not null default 0,
  price       numeric(10,2) not null default 0,
  sale_price  numeric(10,2),
  status      text not null default 'draft' check (status in ('draft','published')),
  created_at  timestamptz default now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────────

alter table categories      enable row level security;
alter table colors          enable row level security;
alter table products        enable row level security;
alter table product_variants enable row level security;

-- Leitura pública (loja)
create policy "categories_select"  on categories       for select using (true);
create policy "colors_select"      on colors           for select using (true);
create policy "products_select"    on products         for select using (true);
create policy "variants_select"    on product_variants for select using (true);

-- Escrita apenas para utilizadores autenticados (admin)
create policy "categories_auth"  on categories       for all
  using  (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "colors_auth"      on colors           for all
  using  (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "products_auth"    on products         for all
  using  (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "variants_auth"    on product_variants for all
  using  (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── Storage: bucket de imagens de produto ─────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "img_public_read"  on storage.objects
  for select using (bucket_id = 'product-images');

create policy "img_auth_insert"  on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "img_auth_delete"  on storage.objects
  for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
