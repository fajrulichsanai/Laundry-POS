// Client-side offline transaction handler
import { offlineDB, type OfflineTransaction } from './db'
import { syncManager } from './sync'
import type { CartItem } from '@/lib/actions/pos'

export interface OfflineTransactionInput {
  customerId: string
  userId: string
  items: CartItem[]
  totalAmount: number
  paidAmount: number
  paymentMethod: 'cash' | 'qris' | 'transfer' | 'saldo'
  notes?: string
}

/**
 * Create transaction with offline support
 * Returns transaction ID and invoice number
 */
export async function createOfflineTransaction(
  input: OfflineTransactionInput
): Promise<{ id: string; invoiceNumber: string }> {
  // Generate client-side UUID
  const transactionId = crypto.randomUUID()
  
  // Generate invoice number
  const invoiceNumber = generateInvoiceNumber()

  // Create offline transaction object
  const offlineTransaction: OfflineTransaction = {
    id: transactionId,
    customerId: input.customerId,
    userId: input.userId,
    items: input.items,
    totalAmount: input.totalAmount,
    paidAmount: input.paidAmount,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending'
  }

  // Save to IndexedDB
  await offlineDB.saveTransaction(offlineTransaction)

  // Add to sync queue
  await offlineDB.addToSyncQueue({
    transactionId,
    operation: 'create',
    data: offlineTransaction,
    status: 'pending',
    attempts: 0
  })

  // Trigger sync if online
  if (syncManager.isOnline()) {
    // Non-blocking sync
    syncManager.startSync().catch(console.error)
  }

  return {
    id: transactionId,
    invoiceNumber
  }
}

/**
 * Generate invoice number (client-side)
 */
function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV${year}${month}${day}${random}`
}

/**
 * Get all transactions (online + offline)
 */
export async function getAllTransactionsWithOffline() {
  try {
    // Get offline transactions
    const offlineTransactions = await offlineDB.getAllTransactions()

    // Transform to match transaction format
    return offlineTransactions.map(t => ({
      id: t.id,
      invoice_number: `${t.id.substring(0, 8)}...`, // Show partial ID
      customer: { 
        name: 'Loading...', // Will be loaded from server
        phone: '-' 
      },
      total_amount: t.totalAmount,
      paid_amount: t.paidAmount,
      payment_status: t.paidAmount >= t.totalAmount ? 'paid' as const : 
                     t.paidAmount > 0 ? 'partial' as const : 'unpaid' as const,
      order_status: 'processing' as const,
      payment_method: t.paymentMethod,
      notes: t.notes,
      created_at: t.createdAt,
      _offline: true,
      _syncStatus: t.syncStatus
    }))
  } catch (error) {
    console.error('Failed to get offline transactions:', error)
    return []
  }
}

/**
 * Check if transactions need sync
 */
export async function needsSync(): Promise<boolean> {
  const status = await syncManager.getSyncStatus()
  return status.pendingCount > 0 || status.failedCount > 0
}
