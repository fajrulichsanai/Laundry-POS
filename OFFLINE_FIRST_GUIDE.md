# Offline-First Implementation Guide

## 📱 Overview

Aplikasi Laundry POS sekarang sudah support **offline-first mechanism** menggunakan:
- **IndexedDB** untuk local storage
- **UUID** untuk client-generated IDs
- **Auto-sync** saat koneksi kembali
- **Duplicate prevention** dengan client_generated_id

---

## 🚀 Setup & Installation

### 1. Run Database Migration

Jalankan migration file di **Supabase SQL Editor**:

```sql
-- File: migration-offline-first-support.sql
```

Migration ini akan:
- Enable UUID extension
- Add `client_generated_id` column (UUID)
- Add `sync_source` column ('online' or 'offline')
- Create indexes untuk performa
- Add unique constraint untuk prevent duplicates
- Update RLS policies

### 2. Deploy ke Vercel

Build dan deploy sudah otomatis handle offline features:

```bash
npm run build
vercel --prod
```

---

## 🔧 How It Works

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  USER ACTION                    │
│            (Create Transaction)                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Check Online? │
         └───────┬───────┘
                 │
        ┌────────┴────────┐
        │                 │
    YES │                 │ NO
        ▼                 ▼
┌─────────────┐    ┌──────────────┐
│ Try Server  │    │ Save Offline │
│ (Supabase)  │    │ (IndexedDB)  │
└──────┬──────┘    └──────┬───────┘
       │                  │
       │ Success          │
       ▼                  ▼
┌─────────────┐    ┌──────────────┐
│   Success   │    │ Add to       │
│   Modal     │    │ Sync Queue   │
└─────────────┘    └──────┬───────┘
                           │
                           ▼
                   ┌──────────────┐
                   │ Auto Sync    │
                   │ When Online  │
                   └──────────────┘
```

### Components

#### 1. **IndexedDB (lib/offline/db.ts)**
Menyimpan data offline dengan struktur:
- `transactions` store: Data transaksi
- `sync_queue` store: Queue untuk sync

#### 2. **Sync Manager (lib/offline/sync.ts)**
Handle sync operations:
- Auto-detect online/offline
- Queue management
- Retry mechanism (max 3 attempts)
- Duplicate prevention

#### 3. **Network Status (components/network/NetworkStatus.tsx)**
UI indicator:
- Online/Offline badge
- Pending sync count
- Manual sync button
- Sync status details

#### 4. **Offline Transactions (lib/offline/transactions.ts)**
Client-side transaction handler:
- UUID generation
- Local storage
- Queue management

---

## 💡 Usage

### Creating Transaction Offline

```typescript
// Automatic offline handling in POS page
// User tidak perlu tahu apakah online/offline

async function handleCheckout() {
  const isOnline = navigator.onLine
  
  if (isOnline) {
    // Try online first
    const result = await createTransaction(data)
    
    if (result.error) {
      // Fallback to offline
      await createOfflineTransaction(data)
    }
  } else {
    // Direct offline
    await createOfflineTransaction(data)
  }
}
```

### Manual Sync

User bisa trigger manual sync via NetworkStatus component:
1. Click badge di pojok kanan bawah
2. Click "Sync Sekarang"

### Auto Sync

Sistem otomatis sync when:
- Device kembali online (event listener)
- Page load (if online)
- After save offline transaction (non-blocking)

---

## 🔍 Sync Flow

### 1. Offline Transaction Created

```javascript
{
  id: "uuid-generated-client",
  customerId: "...",
  items: [...],
  syncStatus: "pending"
}
```

### 2. Added to Sync Queue

```javascript
{
  transactionId: "uuid-generated-client",
  operation: "create",
  status: "pending",
  attempts: 0
}
```

### 3. Online Detection

```javascript
window.addEventListener('online', () => {
  syncManager.startSync()
})
```

### 4. Sync to Supabase

```sql
INSERT INTO transactions (
  client_generated_id,  -- UUID from client
  invoice_number,
  customer_id,
  ...
  sync_source
) VALUES (
  'uuid-generated-client',
  'INV20260315...',
  '...',
  'offline'
);
```

### 5. Duplicate Check

```javascript
// Check if already synced
const existing = await supabase
  .from('transactions')
  .select('id')
  .eq('client_generated_id', clientUUID)

if (existing) {
  // Already synced, skip
  return
}
```

### 6. Update Status

```javascript
// Mark as synced
await offlineDB.updateTransactionStatus(id, 'synced')
```

---

## 📊 Data Structure

### IndexedDB Schema

**Store: transactions**
```typescript
{
  id: string (UUID),
  customerId: string,
  userId: string,
  items: Array<CartItem>,
  totalAmount: number,
  paidAmount: number,
  paymentMethod: string,
  notes?: string,
  createdAt: string (ISO),
  syncStatus: 'pending' | 'synced' | 'failed',
  lastSyncAttempt?: string,
  syncError?: string
}
```

**Store: sync_queue**
```typescript
{
  id: string (UUID),
  transactionId: string,
  operation: 'create' | 'update' | 'delete',
  data: any,
  status: 'pending' | 'synced' | 'failed',
  attempts: number,
  lastAttempt?: string,
  error?: string,
  createdAt: string
}
```

### Supabase Schema

**Table: transactions**
```sql
-- New columns for offline support
client_generated_id UUID UNIQUE,  -- Client UUID
sync_source TEXT DEFAULT 'online' -- 'online' or 'offline'
```

---

## 🎯 User Experience

### Online Mode
1. User create transaction
2. Save to Supabase immediately
3. Show success modal
4. ✅ Done

### Offline Mode
1. User create transaction
2. Save to IndexedDB
3. Show "Saved offline" message
4. ⏳ Waiting for sync
5. When online → Auto sync
6. ✅ Synced

### UI Indicators

**Status Badge (Bottom Right)**
- 🟢 **Online**: Connected, ready
- 🔴 **Offline**: No connection
- 🟡 **Badge number**: Pending sync count

**Click Badge for Details:**
- Sync status (pending/failed/synced)
- Manual sync button
- Offline notice

---

## 🔒 Security & Reliability

### Duplicate Prevention
- ✅ UUID di client (unique per transaction)
- ✅ `client_generated_id` di server (unique constraint)
- ✅ Check before insert
- ✅ Skip if already exists

### Error Handling
- ✅ Retry mechanism (max 3 attempts)
- ✅ Exponential backoff (2s, 4s, 6s)
- ✅ Error logging
- ✅ Failed status tracking

### Data Integrity
- ✅ Transaction items tetap konsisten
- ✅ Created_at dari client (accurate timestamp)
- ✅ Invoice number generated di server
- ✅ Payment status calculated correctly

---

## 🧪 Testing

### Test Offline Mode

1. **Buka DevTools**
2. **Network Tab → Toggle Offline**
3. **Create Transaction**
4. **Check IndexedDB** (Application tab)
5. **Toggle Online**
6. **Wait for sync** (watch console)
7. **Verify in Supabase**

### Test Duplicate Prevention

1. Create transaction offline
2. Toggle online → sync
3. Toggle offline
4. Try create same transaction again
5. Toggle online → should skip duplicate

---

## 📝 Troubleshooting

### Sync Not Working

**Check:**
1. Is device online? (Check badge)
2. Are there pending transactions? (Click badge)
3. Check console for errors
4. Try manual sync button

**Common Issues:**
- RLS policy blocking insert
- Missing client_generated_id column
- Network timeout (retry automatically)

### Data Not Appearing

**Check:**
1. IndexedDB has data? (DevTools → Application)
2. Sync status = 'synced'?
3. Check Supabase table for `client_generated_id`

### Failed Sync

**Actions:**
1. Check error message (click badge → details)
2. Verify database connection
3. Check RLS policies
4. Re-run migration if needed
5. Manual retry (wait 2 seconds between attempts)

---

## 🔮 Future Enhancements

- [ ] Background sync API (when device sleeps)
- [ ] Conflict resolution (untuk multi-user)
- [ ] Partial sync (by date range)
- [ ] Offline viewing transactions
- [ ] Export offline data
- [ ] Sync progress indicator
- [ ] Compress large payloads
- [ ] Delta sync (only changes)

---

## 📚 References

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Online/Offline Events](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

**Last Updated:** March 15, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
