import { Client } from "pg";

const connectionString =
  "postgresql://postgres:41oelaDJ0ampESO4@mtenqqxvrxuuhzrdxexp.supabase.co:5432/postgres";

const PROFILES_SQL = `
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS requested_role text NOT NULL DEFAULT 'customer',
    ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true;

UPDATE public.profiles SET approved = true WHERE approved IS NULL;
UPDATE public.profiles SET requested_role = role WHERE requested_role IS NULL OR requested_role = '';

DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'profiles' AND constraint_name = 'profiles_role_check') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'toko', 'courier', 'customer'));
EXCEPTION WHEN OTHERS THEN NULL;
END $;

create index if not exists profiles_requested_role_idx on public.profiles (requested_role);
create index if not exists profiles_approved_idx on public.profiles (approved);

INSERT INTO public.profiles (username, password, role, requested_role, approved)
VALUES ('admin', 'admin', 'admin', 'admin', true), ('toko', 'toko', 'toko', 'toko', true), ('courier', 'courier', 'courier', 'courier', true)
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, requested_role = EXCLUDED.requested_role, approved = true;
`;

const TABLES_SQL = `
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles (id) on delete set null,
  toko_id uuid references public.profiles (id) on delete set null,
  total_amount numeric not null default 0,
  status text not null default 'pending_customer_confirm' check (status in ('pending_customer_confirm','pending_toko_approve','assigned_to_courier','in_transit','delivered','cancelled')),
  shipping_address text, notes text,
  created_at timestamp with time zone default now(), updated_at timestamp with time zone default now()
);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_toko_idx on public.orders (toko_id);
create index if not exists orders_status_idx on public.orders (status);
create or replace function public.set_orders_updated_at() returns trigger language plpgsql as $ begin new.updated_at = now(); return new; end; $;
create trigger _orders_updated_at before update on public.orders for each row execute function public.set_orders_updated_at();

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade not null,
  courier_id uuid references public.profiles (id) on delete set null,
  toko_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending_toko_approve' check (status in ('pending_toko_approve','assigned','picked_up','in_transit','delivered','cancelled')),
  tracking_notes text, assigned_at timestamp with time zone, picked_at timestamp with time zone, delivered_at timestamp with time zone,
  created_at timestamp with time zone default now(), updated_at timestamp with time zone default now()
);
create index if not exists shipments_order_idx on public.shipments (order_id);
create index if not exists shipments_courier_idx on public.shipments (courier_id);
create index if not exists shipments_status_idx on public.shipments (status);
create or replace function public.set_shipments_updated_at() returns trigger language plpgsql as $ begin new.updated_at = now(); return new; end; $;
create trigger _shipments_updated_at before update on public.shipments for each row execute function public.set_shipments_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade not null,
  product_id uuid references public.products (id) on delete set null,
  quantity integer not null default 1, price numeric not null default 0,
  created_at timestamp with time zone default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);
`;

async function main(): Promise<void> {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    query_timeout: 15000,
  });

  try {
    await client.connect();
    console.log("Connected!");

    await client.query(PROFILES_SQL);
    console.log("Profiles migration applied!");

    await client.query(TABLES_SQL);
    console.log("Orders/shipments tables created!");

    const res = await client.query(
      "SELECT username, role, requested_role, approved FROM public.profiles ORDER BY username;"
    );
    console.log("\n=== Akun ===");
    res.rows.forEach((r) =>
      console.log(r.username + ": role=" + r.role + ", approved=" + r.approved)
    );
  } catch (err) {
    const e = err as Error;
    console.error("Error:", e.message || err);
  } finally {
    await client.end();
  }
}

main();
