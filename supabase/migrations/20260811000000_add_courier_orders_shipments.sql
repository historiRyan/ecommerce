-- =====================================================================
-- Migration: tambahkan role 'courier' + tabel orders & shipments untuk
-- tracking pengiriman. Juga pastikan kolom approved/requested_role ada.
-- -----------------------------------------------------------------------
-- Migration ini idempotent — aman dijalankan berulang kali.
-- Jalankan SETELAH migration 20260810000000_profiles.sql.
-- =====================================================================

-------------------------------------------------------------------------------
-- 1. Tambahkan kolom approved & requested_role jika belum ada
--    (gunakan ADD COLUMN IF NOT EXISTS — idempotent & tidak butuh DO block)
-------------------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS requested_role text NOT NULL DEFAULT 'customer',
    ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true;

-- Perbarui kolom untuk akun yang sudah ada (set default jika belum ada nilai)
UPDATE public.profiles SET approved = true WHERE approved IS NULL;
UPDATE public.profiles SET requested_role = role WHERE requested_role IS NULL OR requested_role = '';

-- Index
create index if not exists profiles_requested_role_idx on public.profiles (requested_role);
create index if not exists profiles_approved_idx on public.profiles (approved);

-- Pastikan CHECK constraint role menerima 'courier' (untuk DB lama)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'profiles'
          AND constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
    ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_role_check
        CHECK (role IN ('admin', 'toko', 'courier', 'customer'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-------------------------------------------------------------------------------
-- 2. Upsert akun courier default (sudah disetujui)
-------------------------------------------------------------------------------
insert into public.profiles (username, password, role, requested_role, approved)
values ('courier', 'courier', 'courier', 'courier', true)
on conflict (username)
do update set
  password = 'courier',
  role = 'courier',
  requested_role = 'courier',
  approved = true;

-------------------------------------------------------------------------------
-- 3. Update akun toko & admin default agar termasuk kolom baru
-------------------------------------------------------------------------------
update public.profiles
set requested_role = 'toko', approved = true
where username = 'toko';

update public.profiles
set requested_role = 'admin', approved = true
where username = 'admin';

-------------------------------------------------------------------------------
-- 4. Tabel orders: merepresentasikan pesanan dari customer
-------------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles (id) on delete set null,
  toko_id uuid references public.profiles (id) on delete set null,
  total_amount numeric not null default 0,
  status text not null default 'pending_customer_confirm'
    check (status in (
      'pending_customer_confirm',  -- customer baru saja checkout
      'pending_toko_approve',       -- menunggu approval toko
      'assigned_to_courier',        -- sudah disetujui, di-assign ke kurir
      'in_transit',                 -- kurir mengantarkan
      'delivered',                  -- sampai ke pemesan
      'cancelled'                   -- dibatalkan
    )),
  shipping_address text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_toko_idx on public.orders (toko_id);
create index if not exists orders_status_idx on public.orders (status);

-- Trigger otomatis update kolom updated_at
create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists _orders_updated_at on public.orders;
create trigger _orders_updated_at
  before update on public.orders
  for each row
  execute function public.set_orders_updated_at();

-------------------------------------------------------------------------------
-- 5. Tabel shipments: tracking pengiriman per order
-------------------------------------------------------------------------------
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade not null,
  courier_id uuid references public.profiles (id) on delete set null,
  toko_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending_toko_approve'
    check (status in (
      'pending_toko_approve',   -- order belum disetujui toko
      'assigned',                -- sudah di-assign ke kurir
      'picked_up',               -- kurir sudah ambil barang
      'in_transit',              -- sedang dalam perjalanan
      'delivered',               -- sampai
      'cancelled'                -- dibatalkan
    )),
  tracking_notes text,
  assigned_at timestamp with time zone,
  picked_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists shipments_order_idx on public.shipments (order_id);
create index if not exists shipments_courier_idx on public.shipments (courier_id);
create index if not exists shipments_status_idx on public.shipments (status);

-- Trigger updated_at
create or replace function public.set_shipments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists _shipments_updated_at on public.shipments;
create trigger _shipments_updated_at
  before update on public.shipments
  for each row
  execute function public.set_shipments_updated_at();

-------------------------------------------------------------------------------
-- 6. Tabel order_items: item di dalam setiap order
-------------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade not null,
  product_id uuid references public.products (id) on delete set null,
  quantity integer not null default 1,
  price numeric not null default 0,
  created_at timestamp with time zone default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);
