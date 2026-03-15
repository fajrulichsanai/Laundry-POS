-- ============================================
-- MIGRATION: ADD NOTES COLUMN TO EXPENSES
-- ============================================
-- Menambahkan kolom notes ke tabel expenses untuk catatan tambahan

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.expenses.notes IS 'Catatan tambahan untuk pengeluaran';
