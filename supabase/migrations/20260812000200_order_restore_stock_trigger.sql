-- =====================================================================
-- Migration: restore stock ketika order dibatalkan (cancelled)
--
-- Logika:
--   - Ketika order berubah ke status `cancelled`, maka untuk setiap item,
--     tambahkan kembali quantity ke products.stock_quantity.
--   - Hanya berlaku jika sebelumnya order sudah dikonfirmasi (pernah berada
--     di `pending_toko_approve` atau setelahnya), artinya stock sudah berkurang.
--
-- Idempotent — aman dijalankan berulang kali.
-- =====================================================================

-- 1. Hapus trigger & function lama jika ada
DROP TRIGGER IF EXISTS _order_restore_stock_on_cancel ON public.orders;
DROP FUNCTION IF EXISTS public.restore_stock_on_order_cancel();

-- 2. Buat function trigger
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  item RECORD;
  prev_status TEXT;
BEGIN
  -- Hanya jalan ketika status berubah KE cancelled,
  -- dan sebelumnya bukan pending_customer_confirm (artinya sudah dikonfirmasi)
  IF NEW.status = 'cancelled' AND OLD.status != 'pending_customer_confirm' THEN
    FOR item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = NEW.id
    LOOP
      IF item.product_id IS NOT NULL THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity + item.quantity
        WHERE id = item.product_id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Pasangkan trigger AFTER UPDATE OF status ON orders
CREATE TRIGGER _order_restore_stock_on_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_stock_on_cancel();

-- 4. Verifikasi
SELECT
  tg.tgname AS trigger_name,
  tg.tgenabled AS enabled
FROM pg_trigger tg
JOIN pg_class c ON c.oid = tg.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE tg.tgname = '_order_restore_stock_on_cancel'
  AND n.nspname = 'public';
