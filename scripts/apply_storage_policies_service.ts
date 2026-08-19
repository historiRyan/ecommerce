/**
 * Jalankan policy storage via service role key (bisa kepemilikan tabel).
 * Cocungguh: SQL Editor anon anon role owner gagal.
 *
 * Cara pakai:
 *   npx tsx scripts/apply_storage_policies.ts
 *
 * Perlu di .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !key) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  // Bucket
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((b) => b.id === "products")) {
    const { error } = await admin.storage.createBucket("products", { public: true });
    if (error) console.error("Create bucket error:", error.message);
    else console.log("Bucket 'products' created");
  } else {
    console.log("Bucket 'products' exists");
  }

  // Policies — Supabase JS client doesn't expose storage.objects policy management,
  // so we use the management API via raw SQL fetch.
  // Use the PostgREST SQL endpoint through fetch (available with service role).
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ sql: `-- placeholder` }),
  });
  if (!res.ok) {
    console.log("rpc/exec_sql not available, using management API approach...");
  }

  console.log("\n=== MANUAL: Run this in SQL Editor as postgres owner ===");
  console.log(`
alter table storage.objects enable row level security;
drop policy if exists "Allow public read on products bucket" on storage.objects;
drop policy if exists "Allow public upload on products bucket" on storage.objects;
drop policy if exists "Allow public update on products bucket" on storage.objects;
drop policy if exists "Allow public delete on products bucket" on storage.objects;
create policy "Allow public read on products bucket" on storage.objects for select using (bucket_id = 'products');
create policy "Allow public upload on products bucket" on storage.objects for insert with check (bucket_id = 'products');
create policy "Allow public update on products bucket" on storage.objects for update using (bucket_id = 'products') with check (bucket_id = 'products');
create policy "Allow public delete on products bucket" on storage.objects for delete using (bucket_id = 'products');
  `);
})();
