-- =====================================================================
-- Migration: tambahkan kolom stock_quantity ke tabel products
--
-- - stock_quantity integer NOT NULL DEFAULT 0
-- - Produk dengan stock_quantity = 0 otomatis tidak muncul di halaman publik
--   (filter di sisi client & server)
--
-- Migration ini idempotent — aman dijalankan berulang kali.
-- Jalankan SETELAH migration 20260810000000_profiles.sql.
-- =====================================================================

-- 1. Tambahkan kolom jika belum ada
ALTER TABLE IF EXISTS public.products
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

-- 2. Set stock default untuk produk yang belum di-set (NULL → 0)
UPDATE public.products SET stock_quantity = 0 WHERE stock_quantity IS NULL;

-- 3. Index untuk performa filter stock di halaman publik
CREATE INDEX IF NOT EXISTS products_stock_idx ON public.products (stock_quantity);
CREATE INDEX IF NOT EXISTS products_in_stock_idx ON public.products (in_stock);

-- 4. Set nilai default stock untuk semua produk yang sudah ada
--    (beri stock 99 sehingga produk demo langsung muncul di halaman publik)
UPDATE public.products SET stock_quantity = 99 WHERE stock_quantity = 0;

-- 5. Verifikasi
SELECT id, name, stock_quantity, in_stock FROM public.products LIMIT 20;
