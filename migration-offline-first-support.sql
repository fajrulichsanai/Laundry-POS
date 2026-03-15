-- ============================================
-- MIGRATION: ADD UUID SUPPORT FOR OFFLINE-FIRST
-- ============================================
-- Enables client-generated UUIDs untuk offline transactions

-- 1. Change transactions table to use UUID primary key
-- (Only if not already UUID - check your current schema first)

-- If transactions.id is currently BIGSERIAL, you need to:
-- WARNING: This is a breaking change! Backup your data first!

-- Option 1: Keep current structure (RECOMMENDED for existing data)
-- Just ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Option 2: For new installations, create with UUID from start
-- ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
-- ALTER TABLE transactions ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
-- ALTER TABLE transactions ALTER COLUMN id SET DEFAULT uuid_generate_v4();
-- ALTER TABLE transactions ADD PRIMARY KEY (id);

-- 2. Add index for sync performance
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_invoice_number_idx ON transactions(invoice_number);

-- 3. Allow clients to specify UUID when inserting
-- Ensure RLS policies allow inserts with custom IDs

-- 4. If using BIGSERIAL (current), add a sync tracking column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'online';

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS client_generated_id UUID;

CREATE INDEX IF NOT EXISTS transactions_client_generated_id_idx 
ON transactions(client_generated_id) WHERE client_generated_id IS NOT NULL;

-- 5. Add unique constraint to prevent duplicates from offline sync
ALTER TABLE transactions 
ADD CONSTRAINT unique_client_generated_id 
UNIQUE (client_generated_id);

-- 6. Update RLS policies to allow offline sync
-- Allow authenticated users to insert with custom IDs
DROP POLICY IF EXISTS "Users can insert own transactions with UUID" ON transactions;

CREATE POLICY "Users can insert own transactions with UUID"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id::text OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
  )
);

-- Allow reading transactions for sync verification
DROP POLICY IF EXISTS "Users can read own transactions for sync" ON transactions;

CREATE POLICY "Users can read own transactions for sync"
ON transactions FOR SELECT
TO authenticated
USING (
  auth.uid()::text = user_id::text OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
  )
);

-- ============================================
-- NOTES FOR IMPLEMENTATION:
-- ============================================
-- 
-- For offline-first approach with existing BIGSERIAL ID:
-- 1. Keep current id as BIGSERIAL (auto-increment)
-- 2. Use client_generated_id (UUID) for deduplication
-- 3. When syncing offline transaction:
--    - Client generates UUID and stores in client_generated_id
--    - Server checks if client_generated_id exists
--    - If exists, skip insert (already synced)
--    - If not exists, insert with new auto-increment id
-- 
-- This approach maintains backward compatibility while
-- enabling offline-first functionality.
-- ============================================
