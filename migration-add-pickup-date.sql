-- ============================================
-- MIGRATION: ADD PICKUP DATE TO TRANSACTIONS
-- ============================================
-- Menambahkan kolom pickup_date untuk mencatat kapan laundry diambil pelanggan

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS pickup_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.transactions.pickup_date IS 'Tanggal dan waktu ketika laundry diambil oleh pelanggan';

-- Opsional: Update data existing yang sudah status 'taken' tapi belum ada pickup_date
-- UPDATE public.transactions 
-- SET pickup_date = updated_at 
-- WHERE order_status = 'taken' AND pickup_date IS NULL;
