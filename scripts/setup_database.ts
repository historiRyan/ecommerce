/**
 * Script otomatis untuk setup database Supabase via service-role client:
 * - Membuat tabel profiles, categories, products, product_images
 * - Membuat storage bucket 'products' + policies
 * - Membuat akun admin default (admin / admin, role admin)
 *
 * Cara pakai:
 *   npx tsx scripts/setup_database.ts
 *
 * Perlu di .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (bukan anon key — harus service role)
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("=== Setup Database via Service Role ===\n");

  console.log("1. Membuat tabel & kategori via migration SQL...");
  // Run the schema DDL through supabase.rpc if available, otherwise the user
  // must apply the migration file manually in the SQL Editor.
  const migrationNote = `
Catatan: Supabase JS client tidak mendukung DDL langsung.
Pastikan migration berikut sudah dijalankan di SQL Editor:
  supabase/migrations/20260810000000_profiles.sql
`;
  console.log(migrationNote);

  console.log("2. Membuat/meremverifikasi bucket 'products'...");
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b) => b.id === "products");
  if (!exists) {
    const { error } = await admin.storage.createBucket("products", { public: true });
    if (error) console.error("   Bucket error:", error.message);
    else console.log("   Bucket 'products' dibuat!");
  } else {
    console.log("   Bucket 'products' sudah ada.");
  }

  console.log("3. Membuat storage policies...");
  console.log("   Policies hanya bisa dibuat lewat SQL Editor. Jalankan:");
  console.log("   supabase/storage/setup_products_storage.sql");

  console.log("4. Verifikasi akun admin...");
const { data: adminRow, error: adminErr } = await admin
    .from("profiles")
    .select("username, role")
    .eq("username", "admin")
    .maybeSingle();

  if (adminErr) {
    console.error("   Error:", adminErr.message);
  } else if (adminRow) {
    console.log("   Akun admin:", adminRow.username, "→", adminRow.role);
  } else {
     const { error } = await admin.from("profiles").insert({ username: "admin", password: "admin", role: "admin", requested_role: "admin", approved: true });
    if (error) console.error("   Gagal buat admin:", error.message);
    else console.log("   Akun admin dibuat: admin / admin (role: admin)");
  }

  // --- Akun toko default ---
  const { data: tokoRow, error: tokoErr } = await admin
    .from("profiles")
    .select("username, role")
    .eq("username", "toko")
    .maybeSingle();

  if (tokoErr) {
    console.error("   Error:", tokoErr.message);
  } else if (tokoRow) {
    console.log("   Akun toko:", tokoRow.username, "→", tokoRow.role);
  } else {
     const { error } = await admin.from("profiles").insert({ username: "toko", password: "toko", role: "toko", requested_role: "toko", approved: true });
    if (error) console.error("   Gagal buat toko:", error.message);
    else console.log("   Akun toko dibuat: toko / toko (role: toko)");
  }

  // --- Akun courier default ---
  const { data: courierRow, error: courierErr } = await admin
    .from("profiles")
    .select("username, role")
    .eq("username", "courier")
    .maybeSingle();

  if (courierErr) {
    console.error("   Error:", courierErr.message);
  } else if (courierRow) {
    console.log("   Akun courier:", courierRow.username, "→", courierRow.role);
  } else {
    const { error } = await admin.from("profiles").insert({ username: "courier", password: "courier", role: "courier", requested_role: "courier", approved: true });
    if (error) console.error("   Gagal buat courier:", error.message);
    else console.log("   Akun courier dibuat: courier / courier (role: courier)");
  }

  console.log("\n=== Selesai ===");
  console.log("Login Admin:   Username: admin   Password: admin   Role: admin");
  console.log("Login Toko:    Username: toko    Password: toko    Role: toko (bisa upload produk)");
  console.log("Login Courier: Username: courier Password: courier Role: courier (kelola pengiriman)");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
