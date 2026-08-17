-- Tabel profiles untuk login berbasis username/password
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  role text not null default 'customer' check (role in ('admin', 'toko', 'courier', 'customer')),
  -- requested_role: role yang diminta saat pendaftarian (untuk akun toko/kurir yang butuh persetujuan)
  requested_role text not null default 'customer' check (requested_role in ('admin', 'toko', 'courier', 'customer')),
  -- approved: apakah akun sudah disetujui admin (customer dan admin otomatis approved)
  approved boolean not null default true,
  created_at timestamp with time zone default now()
);

-- Hapus trigger lama karena kita tidak pakai auth.users
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Index
create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_requested_role_idx on public.profiles (requested_role);
create index if not exists profiles_approved_idx on public.profiles (approved);

-- Upsert akun admin default
insert into public.profiles (username, password, role, requested_role, approved)
values ('admin', 'admin', 'admin', 'admin', true)
on conflict (username)
do update set
  password = 'admin',
  role = 'admin',
  requested_role = 'admin',
  approved = true;

-- Upsert akun toko default (bisa login & upload produk seperti admin)
-- Akun ini sudah disetujui (approved = true) sehingga bisa langsung dipakai.
insert into public.profiles (username, password, role, requested_role, approved)
values ('toko', 'toko', 'toko', 'toko', true)
on conflict (username)
do update set
  password = 'toko',
  role = 'toko',
  requested_role = 'toko',
  approved = true;

-- Upsert akun courier default (bisa login & kelola pengiriman)
-- Akun ini sudah disetujui (approved = true) sehingga bisa langsung dipakai.
insert into public.profiles (username, password, role, requested_role, approved)
values ('courier', 'courier', 'courier', 'courier', true)
on conflict (username)
do update set
  password = 'courier',
  role = 'courier',
  requested_role = 'courier',
  approved = true;

-------------------------------------------------------------------------------
-- Kategori produk (dinamis: admin/toko dapat menambah dari UI)
-------------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  "order" integer not null default 0,
  created_at timestamp with time zone default now()
);

create index if not exists categories_slug_idx on public.categories (slug);

-------------------------------------------------------------------------------
-- Produk
-------------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  price numeric not null default 0,
  original_price numeric,
  category_id uuid references public.categories (id) on delete set null,
  in_stock boolean not null default true,
  featured boolean not null default false,
  rating numeric default 0,
  review_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_created_by_idx on public.products (created_by);
create index if not exists products_featured_idx on public.products (featured);

-- Trigger otomatis update kolom updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger _products_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

------------------------------------------------------------------------------
-- Image produk: satu produk boleh punya banyak gambar.
-- Kolom `slideshow_order` memungkinkan mengatur urutan slideshow.
------------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade not null,
  url text not null,
  alt text,
  position integer not null default 0,
  created_at timestamp with time zone default now()
);

create index if not exists product_images_product_idx on public.product_images (product_id);

------------------------------------------------------------------------------
-- Storage bucket manual: file produk disimpan di direktori supabase storage
-- bucket 'products'. Jika produk dihapus, file di direktorinya juga ikut
-- terhapus (on delete cascade di atas + pembersihan file di aplikasi).
------------------------------------------------------------------------------

-- Upsert kategori default agar UI tidak kosong
insert into public.categories (name, slug, "order")
values
  ('Audio', 'audio', 1),
  ('Jam', 'watches', 2),
  ('Sepatu', 'footwear', 3),
  ('Kacamata', 'eyewear', 4),
  ('Tas', 'bags', 5),
  ('Rumah', 'home', 6),
  ('Kamera', 'cameras', 7),
  ('Parfum', 'fragrance', 8)
on conflict (slug) do update set name = excluded.name;
