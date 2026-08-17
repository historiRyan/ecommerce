-- =====================================================================
-- Migration: sistem review & komentar pada produk yang sudah dibeli
--
-- - Tabel product_reviews menyimpan rating (1-5) + komentar pelanggan.
-- - Hanya customer yang pernah membeli produk (order_item terkait
--   dengan profile customer) yang boleh memberi review.
-- - Trigger otomatis update rating & review_count di tabel products.
-- - Kolom products.review_count & rating sudah ada dari migrasi
--   20260810000000_profiles.sql.
--
-- Idempotent — aman dijalankan berulang kali.
-- Jalankan SETELAH migration 20260812010000_profiles_chat_avatar.sql.
-- =====================================================================

-------------------------------------------------------------------------------
-- 1. Tabel product_reviews
--    - Kolom order_id mengikat review pada transaksi (order) tertentu.
--    - Satu transaksi yang selesai (status 'delivered') boleh memberi 1 ulasan
--      per produk. Customer yang sama boleh memberi ulasan produk yang sama
--      lagi, selama dari transaksi (order) berbeda.
--    - Idempotent: tabel dibuat jika belum ada; kolom order_id dan unique
--      constraint ditambahkan jika belum ada (untuk DB lama yang sudah punya
--      tabel product_reviews tanpa order_id).
-------------------------------------------------------------------------------
create table if not exists public.product_reviews (
    id uuid primary key default gen_random_uuid(),
    product_id uuid references public.products (id) on delete cascade not null,
    order_id uuid references public.orders (id) on delete cascade,
    customer_id uuid references public.profiles (id) on delete cascade not null,
    rating integer not null check (rating in (1, 2, 3, 4, 5)),
    title text,
    body text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Tambahkan kolom order_id & FK jika belum ada (DB lama).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'product_reviews'
          AND column_name = 'order_id'
    ) THEN
        ALTER TABLE public.product_reviews
            ADD COLUMN order_id uuid references public.orders (id) on delete cascade;
    END IF;
END $$;

-- Unique constraint per (product_id, order_id) agar 1 transaksi = 1 review per produk.
-- (Lama memakai unique (product_id, customer_id); kita drop & ganti agar customer
--  yang sama boleh review produk sama dari order berbeda.)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_name = tc.constraint_name
         AND kcu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'product_reviews'
          AND tc.constraint_name = '_product_reviews_product_customer_unique'
    ) THEN
        ALTER TABLE public.product_reviews
            DROP CONSTRAINT _product_reviews_product_customer_unique;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'product_reviews'
          AND constraint_name = '_product_reviews_product_order_unique'
    ) THEN
        ALTER TABLE public.product_reviews
            ADD CONSTRAINT _product_reviews_product_order_unique
            UNIQUE (product_id, order_id);
    END IF;
END $$;

create index if not exists product_reviews_product_idx on public.product_reviews (product_id);
create index if not exists product_reviews_customer_idx on public.product_reviews (customer_id);
create index if not exists product_reviews_order_idx on public.product_reviews (order_id);
create index if not exists product_reviews_rating_idx on public.product_reviews (rating);
create index if not exists product_reviews_created_idx on public.product_reviews (created_at desc);

-- Trigger updated_at
create or replace function public.set_product_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists _product_reviews_updated_at on public.product_reviews;
create trigger _product_reviews_updated_at
    before update on public.product_reviews
    for each row
    execute function public.set_product_reviews_updated_at();

-------------------------------------------------------------------------------
-- 2. Fungsi & trigger: recompute rating + review_count di products
--    Dipanggil AFTER INSERT / UPDATE / DELETE pada product_reviews.
-------------------------------------------------------------------------------
create or replace function public.recompute_product_rating()
returns trigger
language plpgsql
as $$
declare
    v_product_id uuid;
begin
    -- tentukan product_id dari row yang berubah
    if TG_OP = 'DELETE' then
        v_product_id := OLD.product_id;
    else
        v_product_id := NEW.product_id;
    end if;

    update public.products
    set rating = subquery.avg_rating,
        review_count = subquery.cnt
    from (
        select
            coalesce(avg(rating), 0) as avg_rating,
            coalesce(count(*), 0) as cnt
        from public.product_reviews
        where product_id = v_product_id
    ) as subquery
    where id = v_product_id;

    return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists _product_reviews_recompute_rating_ins on public.product_reviews;
drop trigger if exists _product_reviews_recompute_rating_upd on public.product_reviews;
drop trigger if exists _product_reviews_recompute_rating_del on public.product_reviews;

create trigger _product_reviews_recompute_rating_ins
    after insert on public.product_reviews
    for each row
    execute function public.recompute_product_rating();

create trigger _product_reviews_recompute_rating_upd
    after update on public.product_reviews
    for each row
    execute function public.recompute_product_rating();

create trigger _product_reviews_recompute_rating_del
    after delete on public.product_reviews
    for each row
    execute function public.recompute_product_rating();

-------------------------------------------------------------------------------
-- 3. Helper function: cek apakah customer pernah membeli produk tertentu
--    pada order yang selesai (status 'delivered'). Versi order-scoped memaksa
--    order yang diberikan memang milik customer & sudah delivered.
--    (dipakai di aplikasi / views RLS).
-------------------------------------------------------------------------------
create or replace function public.customer_bought_product(p_customer uuid, p_product uuid)
returns boolean
language plpgsql
as $$
declare
    v_count int;
begin
    select count(*) into v_count
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.customer_id = p_customer
      and oi.product_id = p_product
      and o.status = 'delivered';
    return v_count > 0;
end;
$$;

-- Varian yang memastikan order_id tertentu sudah selesai & valid untuk review.
create or replace function public.customer_bought_in_order(p_customer uuid, p_order uuid)
returns boolean
language plpgsql
as $$
declare
    v_count int;
begin
    select count(*) into v_count
    from public.orders o
    where o.id = p_order
      and o.customer_id = p_customer
      and o.status = 'delivered';
    return v_count > 0;
end;
$$;

-------------------------------------------------------------------------------
-- 4. View bantu: review per produk (siap pakai frontend)
--    Menggabungkan profile customer agar nama + avatar langsung tersedia.
--    DROP dulu agar CREATE baru tidak bentrok kolom bila struktur berubah.
-------------------------------------------------------------------------------
drop view if exists public.product_reviews_v;
create view public.product_reviews_v as
select
    r.id,
    r.product_id,
    r.order_id,
    r.customer_id,
    p.username,
    p.full_name,
    p.avatar_path,
    r.rating,
    r.title,
    r.body,
    r.created_at,
    r.updated_at
from public.product_reviews r
join public.profiles p on p.id = r.customer_id;

-------------------------------------------------------------------------------
-- 5. Row Level Security (RLS) untuk product_reviews
--    Catatan: aplikasi ini memakai auth custom (profil di DB, koneksi anon key).
--    Karena login tidak lewat Supabase Auth, semua koneksi frontend terdeteksi
--    sebagai 'anon', bukan 'authenticated'. Validasi "sudah beli / order
--    selesai" dilakukan di lapisan aplikasi (lihat ProductReview.tsx & RPC
--    customer_bought_in_order). Policy di sini untuk public (anon+auth) agar
--    konsisten dengan storage policies yang sudah ada.
-------------------------------------------------------------------------------
-- 5a. RLS on the base table.
--     Drop semua policy lama (termasuk yang namanya berbeda) agar tidak
--     menyentil INSERT/UPDATE/DELETE dari frontend anon.
alter table public.product_reviews enable row level security;

-- Hapus policy yang mungkin sudah pernah kita set
drop policy if exists "reviews: public can insert" on public.product_reviews;
drop policy if exists "reviews: public can update" on public.product_reviews;
drop policy if exists "reviews: public can delete" on public.product_reviews;

-- Lalu bersihkan sisa policy yang mungkin masih ada dengan nama lain
DO $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'product_reviews'
    LOOP
        EXECUTE 'drop policy if exists ' || quote_ident(r.policyname) || ' on public.product_reviews';
    END LOOP;
END $$;

-- Policy ke anon (ini krusial — frontend pakai anon key karena auth custom).
create policy "reviews: public can insert"
on public.product_reviews for insert
to anon
with check (true);

create policy "reviews: public can update"
on public.product_reviews for update
to anon
using (true)
with check (true);

create policy "reviews: public can delete"
on public.product_reviews for delete
to anon
using (true);

create policy "reviews: public can insert authed"
on public.product_reviews for insert
to authenticated
with check (true);

create policy "reviews: public can update authed"
on public.product_reviews for update
to authenticated
using (true)
with check (true);

create policy "reviews: public can delete authed"
on public.product_reviews for delete
to authenticated
using (true);

grant select on public.product_reviews_v to anon, authenticated;
