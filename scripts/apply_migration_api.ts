import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env");
  process.exit(1);
}

async function runSql(sql: string): Promise<void> {
  // Supabase Management API v1: execute SQL
  // Endpoint: https://api.supabase.com/v1/projects/{ref}/sql
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/sql`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SQL HTTP ${res.status}: ${text}`);
  }
  console.log("SQL response:", text.slice(0, 200));
}

async function main() {
  console.log("=== Apply product_reviews migration via Management API ===\n");

  const file = "supabase/migrations/20260812020000_product_reviews.sql";
  const sql = fs.readFileSync(file, "utf8");

  // Split by ';' at end of line untuk menghindari masalah query panjang,
  // tapi karena ada DO $$ ... $$, kita eksekusi per-statement secara aman.
  // Sederhana: kirim seluruh file sekaligus — Supabase SQL endpoint menerima multi-statement.
  await runSql(sql);
  console.log("\nMigrasi product_reviews selesai.");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
