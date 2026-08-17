-- =====================================================================
-- STORAGE SETUP: buat bucket 'avatars' + policy agar foto profil bisa
-- di-upload dan diakses publik.
--
-- Jalankan di Supabase SQL Editor SETELAH migration
-- 20260812010000_profiles_chat_avatar.sql selesai diterapkan
-- (atau jalankan ini langsung jika belum).
-- =====================================================================

-- 1. Buat bucket jika belum ada
insert into storage.buckets (id, name, public, created_at, updated_at)
values ('avatars', 'avatars', true, now(), now())
on conflict (id) do nothing;

-- 2. Pastikan RLS aktif pada tabel storage.objects
alter table storage.objects enable row level security;

-- 3. Bersihkan policy lama (jika ada) supaya tidak bentrok
drop policy if exists "Allow public read on avatars bucket" on storage.objects;
drop policy if exists "Allow public upload on avatars bucket" on storage.objects;
drop policy if exists "Allow public update on avatars bucket" on storage.objects;
drop policy if exists "Allow public delete on avatars bucket" on storage.objects;

-- 4. Policy: semua orang (anon & authenticated) boleh baca file avatar
create policy "Allow public read on avatars bucket"
on storage.objects for select
using (bucket_id = 'avatars');

-- 5. Policy: anon & authenticated boleh upload (insert) ke bucket avatars
create policy "Allow public upload on avatars bucket"
on storage.objects for insert
with check (bucket_id = 'avatars');

-- 6. Policy: boleh update dan delete (untuk fitur ganti/hapus avatar)
create policy "Allow public update on avatars bucket"
on storage.objects for update
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

create policy "Allow public delete on avatars bucket"
on storage.objects for delete
using (bucket_id = 'avatars');

-- 7. Verifikasi bucket sudah ada
select id, name, public from storage.buckets where id = 'avatars';
