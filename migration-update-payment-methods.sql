-- ============================================
-- MIGRATION: UPDATE PAYMENT METHODS
-- ============================================
-- Update constraint payment_method untuk mendukung metode pembayaran baru
-- Menghapus: e-wallet, debit, credit
-- Menambah: saldo (untuk pembayaran menggunakan saldo pelanggan)

-- PENTING: Update data existing TERLEBIH DAHULU sebelum mengubah constraint
-- Urutan ini sangat penting agar tidak terjadi error constraint violation

-- 1. Update existing data yang menggunakan metode lama
-- Ubah e-wallet, debit, credit menjadi cash
UPDATE public.transactions 
SET payment_method = 'cash' 
WHERE payment_method IN ('e-wallet', 'debit', 'credit');

-- 2. Update 'balance' menjadi 'saldo' jika ada
UPDATE public.transactions 
SET payment_method = 'saldo' 
WHERE payment_method = 'balance';

-- 3. Update payment_method yang NULL menjadi 'cash' (jika ada)
UPDATE public.transactions 
SET payment_method = 'cash' 
WHERE payment_method IS NULL;

-- 4. Drop constraint lama
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

-- 5. Tambah constraint baru dengan metode pembayaran yang diupdate
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method IN ('cash', 'qris', 'transfer', 'saldo'));

-- 6. Update comment untuk dokumentasi
COMMENT ON COLUMN public.transactions.payment_method IS 'Metode pembayaran: cash (tunai), qris, transfer (bank transfer), saldo (saldo pelanggan)';
