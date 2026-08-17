import { Client } from "pg";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log("Terhubung ke database.");

  const file = "supabase/migrations/20260812020000_product_reviews.sql";
  const sql = fs.readFileSync(file, "utf8");

  // Eksekusi seluruh migrasi sebagai satu query
  const result = await client.query(sql);
  console.log("Migrasi product_reviews selesai. Rows affected:", JSON.stringify(result.rowCount));

  // Verifikasi policy
  const policies = await client.query(
    `select polname, pg_roles.rolname as role
     from pg_policy p
     join pg_roles on pg_roles.oid = p.polroleid
     join pg_class c on c.oid = p.polrelid
     where c.relname = 'product_reviews'`
  );
  console.log("Policy product_reviews:", JSON.stringify(policies.rows, null, 2));

  // Verifikasi kolom order_id
  const cols = await client.query(
    `select column_name, is_nullable from information_schema.columns
     where table_schema='public' and table_name='product_reviews'`
  );
  console.log("Kolom product_reviews:", JSON.stringify(cols.rows, null, 2));

  await client.end();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
