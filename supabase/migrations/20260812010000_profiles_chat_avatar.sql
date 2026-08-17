-- =====================================================================
-- Migration: profil foto + sistem chat antar customer dan toko
--
-- Idempotent — aman dijalankan berulang kali.
-- Jalankan SETELAH migration 20260812000100_order_decrease_stock_trigger.sql.
-- =====================================================================

-------------------------------------------------------------------------------
-- 1. Bucket storage avatar profil (dibuat via SQL manual — bucket table)
--    Bucket bernama 'avatars' dan di-set public supaya guest & user bisa baca.
-------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, created_at, updated_at)
values ('avatars', 'avatars', true, now(), now())
on conflict (id) do nothing;

-- RLS + policy supaya siapa saja boleh baca & user yang terdaftar boleh upload
alter table storage.objects enable row level security;

drop policy if exists "Allow public read on avatars bucket" on storage.objects;
drop policy if exists "Allow public upload on avatars bucket" on storage.objects;
drop policy if exists "Allow public update on avatars bucket" on storage.objects;
drop policy if exists "Allow public delete on avatars bucket" on storage.objects;

create policy "Allow public read on avatars bucket"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Allow public upload on avatars bucket"
on storage.objects for insert
with check (bucket_id = 'avatars');

create policy "Allow public update on avatars bucket"
on storage.objects for update
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

create policy "Allow public delete on avatars bucket"
on storage.objects for delete
using (bucket_id = 'avatars');

-------------------------------------------------------------------------------
-- 2. Kolom profil: full_name, bio, avatar_path
--    avatar_path menyimpan path file di storage bucket 'avatars'.
-------------------------------------------------------------------------------
alter table public.profiles
    add column if not exists full_name text,
    add column if not exists bio text,
    add column if not exists avatar_path text;

create index if not exists profiles_avatar_path_idx on public.profiles (avatar_path);

-------------------------------------------------------------------------------
-- 3. Tabel chat_rooms: satu ruangan per (customer, toko)
--    toko_id berasal dari produk yang dibahas (created_by produk).
-------------------------------------------------------------------------------
create table if not exists public.chat_rooms (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid references public.profiles (id) on delete cascade not null,
    toko_id uuid references public.profiles (id) on delete cascade not null,
    product_id uuid references public.products (id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique (customer_id, toko_id, product_id)
);

create index if not exists chat_rooms_customer_idx on public.chat_rooms (customer_id);
create index if not exists chat_rooms_toko_idx on public.chat_rooms (toko_id);
create index if not exists chat_rooms_product_idx on public.chat_rooms (product_id);
create index if not exists chat_rooms_updated_idx on public.chat_rooms (updated_at desc);

-- Trigger updated_at
create or replace function public.set_chat_rooms_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists _chat_rooms_updated_at on public.chat_rooms;
create trigger _chat_rooms_updated_at
    before update on public.chat_rooms
    for each row
    execute function public.set_chat_rooms_updated_at();

-------------------------------------------------------------------------------
-- 4. Tabel chat_messages: pesan di dalam chat_rooms
--    sender_id bisa customer atau toko (pembuat ruangan).
-------------------------------------------------------------------------------
create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    room_id uuid references public.chat_rooms (id) on delete cascade not null,
    sender_id uuid references public.profiles (id) on delete set null not null,
    body text not null,
    is_read boolean not null default false,
    created_at timestamp with time zone default now()
);

create index if not exists chat_messages_room_idx on public.chat_messages (room_id);
create index if not exists chat_messages_sender_idx on public.chat_messages (sender_id);
create index if not exists chat_messages_created_idx on public.chat_messages (created_at);
create index if not exists chat_messages_unread_idx on public.chat_messages (room_id, is_read) where is_read = false;

-------------------------------------------------------------------------------
-- 5. View bantu: unread_count per room untuk notifikasi di UI
--    (opsional — query di kode juga bisa langsung ke tabel)
-------------------------------------------------------------------------------
create or replace view public.chat_unread_counts as
select
    room_id,
    count(*) as unread
from public.chat_messages
where is_read = false
group by room_id;
