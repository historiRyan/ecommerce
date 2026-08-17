"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL tidak ditemukan di .env");
    process.exit(1);
}
async function main() {
    const client = new pg_1.Client({ connectionString: databaseUrl });
    await client.connect();
    console.log("Terhubung ke database.");
    const file = "supabase/migrations/20260812020000_product_reviews.sql";
    const sql = fs.readFileSync(file, "utf8");
    // Eksekusi seluruh migrasi sebagai satu query
    const result = await client.query(sql);
    console.log("Migrasi product_reviews selesai. Rows affected:", JSON.stringify(result.rowCount));
    // Verifikasi policy
    const policies = await client.query(`select polname, pg_roles.rolname as role
     from pg_policy p
     join pg_roles on pg_roles.oid = p.polroleid
     join pg_class c on c.oid = p.polrelid
     where c.relname = 'product_reviews'`);
    console.log("Policy product_reviews:", JSON.stringify(policies.rows, null, 2));
    // Verifikasi kolom order_id
    const cols = await client.query(`select column_name, is_nullable from information_schema.columns
     where table_schema='public' and table_name='product_reviews'`);
    console.log("Kolom product_reviews:", JSON.stringify(cols.rows, null, 2));
    await client.end();
}
main().catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
});
