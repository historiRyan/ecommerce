-- =====================================================================
-- Migration: trigger otomatis kurangi stok produk saat order dikonfirmasi
--
-- Logika:
--   - Saat sebuah ORDER berubah status dari `pending_customer_confirm`
--     ke `pending_toko_approve`, maka untuk setiap item di order_items,
--     kurangi `products.stock_quantity` sesuai quantity yang dibeli.
--   - Jika stock tidak mencukupi, trigger akan RAISE EXCEPTION dan
--     mencegah transisi status (order tetap pending_customer_confirm).
--
-- Trigger dipasangkan pada trigger yang SUDAH ada (_orders_updated_at)
-- — kita gunakan trigger terpisah (AFTER UPDATE OF status).
--
-- Idempotent — aman dijalankan berulang kali.
-- =====================================================================

-- 1. Hapus trigger & function lama jika ada (supaya bisa di-recreate)
DROP TRIGGER IF EXISTS _order_decrease_stock_on_confirm ON public.orders;
DROP FUNCTION IF EXISTS public.decrease_stock_on_order_confirm();

-- 2. Buat function trigger
CREATE OR REPLACE FUNCTION public.decrease_stock_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  item RECORD;
  current_stock INTEGER;
BEGIN
  -- Hanya jalan ketika status berubah dari pending_customer_confirm ke pending_toko_approve
  IF OLD.status = 'pending_customer_confirm' AND NEW.status = 'pending_toko_approve' THEN
    FOR item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = NEW.id
    LOOP
      IF item.product_id IS NOT NULL THEN
        -- Dapatkan stock saat ini
        SELECT stock_quantity INTO current_stock
        FROM public.products
        WHERE id = item.product_id
        FOR UPDATE;

        -- Validasi stock cukup
        IF (current_stock - item.quantity) < 0 THEN
          RAISE EXCEPTION 'Stok produk % tidak mencukupi. Diminta: %, Tersedia: %',
            item.product_id, item.quantity, current_stock
            USING ERRCODE = 'check_violation';
        END IF;

        -- Kurangi stock
        UPDATE public.products
        SET stock_quantity = stock_quantity - item.quantity
        WHERE id = item.product_id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Pasangkan trigger AFTER UPDATE OF status ON orders
CREATE TRIGGER _order_decrease_stock_on_confirm
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrease_stock_on_confirm();

-- 4. Verifikasi
SELECT
  tg.tgname AS trigger_name,
  tg.tgenabled AS enabled
FROM pg_trigger tg
JOIN pg_class c ON c.oid = tg.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE tg.tgname = '_order_decrease_stock_on_confirm'
  AND n.nspname = 'public';
