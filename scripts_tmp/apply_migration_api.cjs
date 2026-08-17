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
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv.config();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!supabaseUrl || !serviceRoleKey) {
    console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env");
    process.exit(1);
}
async function runSql(sql) {
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
