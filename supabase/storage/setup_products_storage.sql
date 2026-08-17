-- =====================================================================
-- STORAGE SETUP: buat bucket 'products' + policy agar file bisa di-upload
-- dan diakses publik.
--
-- Jalankan di Supabase SQL Editor SETELAH migration
-- 20260810000000_profiles.sql dan 20260811000000_add_courier_orders_shipments.sql
-- =====================================================================

-- 1. Buat bucket jika belum ada
insert into storage.buckets (id, name, public, created_at, updated_at)
values ('products', 'products', true, now(), now())
on conflict (id) do nothing;

-- 2. Pastikan RLS aktif pada tabel storage.objects
alter table storage.objects enable row level security;

-- 3. Bersihkan policy lama (jika ada) supaya tidak bentrok
drop policy if exists "Allow public read on products bucket" on storage.objects;
drop policy if exists "Allow public upload on products bucket" on storage.objects;
drop policy if exists "Allow public update on products bucket" on storage.objects;
drop policy if exists "Allow public delete on products bucket" on storage.objects;

-- 4. Policy: semua orang (anon & authenticated) boleh baca file produk
create policy "Allow public read on products bucket"
on storage.objects for select
using (bucket_id = 'products');

-- 5. Policy: anon & authenticated boleh upload (insert) ke bucket products
create policy "Allow public upload on products bucket"
on storage.objects for insert
with check (bucket_id = 'products');

-- 6. Policy: boleh update dan delete (untuk fitur edit/hapus gambar)
create policy "Allow public update on products bucket"
on storage.objects for update
using (bucket_id = 'products')
with check (bucket_id = 'products');

create policy "Allow public delete on products bucket"
on storage.objects for delete
using (bucket_id = 'products');

-- 7. Verifikasi bucket sudah ada
select id, name, public from storage.buckets where id = 'products';
