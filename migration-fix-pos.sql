-- ============================================
-- MIGRATION: FIX TRANSACTIONS TABLE FOR POS LAUNDRY
-- ============================================
-- Menambahkan kolom yang kurang untuk flow POS Laundry

-- 0. Drop views yang depend on columns yang akan diubah
DROP VIEW IF EXISTS service_popularity CASCADE;
DROP VIEW IF EXISTS daily_revenue CASCADE;
DROP VIEW IF EXISTS top_customers CASCADE;

-- 1. Tambah kolom payment_method ke transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'qris', 'transfer', 'e-wallet', 'debit', 'credit'));

-- 2. Tambah kolom untuk track finish date lebih baik
-- (sudah ada estimated_completion_date dan completed_at, jadi skip)

-- 3. Verifikasi tipe data numeric sudah support decimal
-- PostgreSQL NUMERIC/DECIMAL default sudah support decimal
-- Tapi mari kita pastikan dengan ALTER jika perlu

-- Pastikan quantity di transaction_items bisa decimal (2.3 kg)
ALTER TABLE public.transaction_items 
ALTER COLUMN quantity TYPE NUMERIC(10, 2);

-- Pastikan price_at_time bisa decimal  
ALTER TABLE public.transaction_items 
ALTER COLUMN price_at_time TYPE NUMERIC(15, 2);

-- Pastikan subtotal bisa decimal
ALTER TABLE public.transaction_items 
ALTER COLUMN subtotal TYPE NUMERIC(15, 2);

-- Pastikan price di services bisa decimal
ALTER TABLE public.services 
ALTER COLUMN price TYPE NUMERIC(15, 2);

-- Pastikan amounts di transactions bisa decimal
ALTER TABLE public.transactions 
ALTER COLUMN total_amount TYPE NUMERIC(15, 2);

ALTER TABLE public.transactions 
ALTER COLUMN paid_amount TYPE NUMERIC(15, 2);

-- 4. Tambah index untuk pencarian customer by phone (untuk flow POS)
CREATE INDEX IF NOT EXISTS idx_customers_phone_search 
ON public.customers(phone);

-- 5. Tambah index untuk pencarian customer by name
CREATE INDEX IF NOT EXISTS idx_customers_name_search 
ON public.customers(name);

-- 6. Tambah index untuk transactions by date (untuk laporan)
CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON public.transactions(created_at DESC);

-- 7. Tambah index untuk transactions by payment_method (untuk laporan)
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method 
ON public.transactions(payment_method);

-- 8. Comment untuk dokumentasi
COMMENT ON COLUMN public.transactions.payment_method IS 'Metode pembayaran: cash, qris, transfer, e-wallet, debit, credit';
COMMENT ON COLUMN public.transactions.paid_amount IS 'Jumlah DP atau yang sudah dibayar. Sisa = total_amount - paid_amount';
COMMENT ON COLUMN public.transaction_items.quantity IS 'Berat dalam kg (bisa decimal seperti 2.3)';

-- 9. Recreate views yang sudah di-drop
-- View untuk daily revenue
CREATE OR REPLACE VIEW daily_revenue AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(paid_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM transactions
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View untuk service popularity
CREATE OR REPLACE VIEW service_popularity AS
SELECT 
  s.name as service_name,
  COUNT(ti.id) as order_count,
  SUM(ti.subtotal) as total_revenue
FROM services s
LEFT JOIN transaction_items ti ON s.id = ti.service_id
GROUP BY s.name
ORDER BY order_count DESC;

-- View untuk customer ranking
CREATE OR REPLACE VIEW top_customers AS
SELECT 
  c.name,
  c.phone,
  COUNT(t.id) as total_orders,
  SUM(t.total_amount) as total_spent
FROM customers c
LEFT JOIN transactions t ON c.id = t.customer_id
GROUP BY c.id, c.name, c.phone
ORDER BY total_spent DESC
LIMIT 10;

-- Verify changes
SELECT 'Migration completed successfully!' as status;
