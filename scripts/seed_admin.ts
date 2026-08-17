/**
 * Script untuk membuat akun admin dan toko default secara langsung di tabel profiles.
 *
 * Cara pakai:
 *   npx tsx scripts/seed_admin.ts
 *
  * Akun yang dibuat:
  *   admin:  Username: admin  Password: admin  Role: admin
  *   toko:   Username: toko   Password: toko   Role: toko (bisa upload produk)
  *   courier: Username: courier Password: courier Role: courier (kelola pengiriman)
 *
 * Pastikan tabel `public.profiles` sudah ada di Supabase Anda.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tidak ditemukan di .env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Membuat akun admin, toko & courier...");

  await upsertAccount("admin", "admin", "admin", true);
  await upsertAccount("toko", "toko", "toko", true);
  await upsertAccount("courier", "courier", "courier", true);

  console.log("");
  console.log("=== Detail Akun ===");
  console.log("Admin   → Username: admin    Password: admin    Role: admin   (approved: true)");
  console.log("Toko    → Username: toko     Password: toko     Role: toko    (approved: true)");
  console.log("Courier → Username: courier  Password: courier  Role: courier (approved: true)");
  console.log("");
  console.log("Silakan login di http://localhost:5173 dengan akun di atas.");
}

async function upsertAccount(username: string, password: string, role: string, approved: boolean = true) {
  const { error } = await supabase
    .from("profiles")
    .insert({ username, password, role, requested_role: role, approved })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      console.log(`Akun "${username}" sudah ada, memperbarui password, role & approval...`);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ password, role, requested_role: role, approved })
        .eq("username", username);

      if (updateError) {
        console.error("Update error:", updateError.message);
        process.exit(1);
      }
      console.log(`Akun "${username}" diperbarui!`);
    } else {
      console.error("Error:", error.message);
      process.exit(1);
    }
  } else {
    console.log(`Akun "${username}" berhasil dibuat!`);
  }
}

main();
