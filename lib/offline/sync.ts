// Sync manager for syncing offline data to Supabase
import { offlineDB, type OfflineTransaction, type SyncQueueItem } from './db'
import { createClient } from '@/lib/supabase/server'
import { createAuthClient } from '@/lib/supabase/auth-client'

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 2000 // 2 seconds

export class SyncManager {
  private isSyncing = false
  private syncInProgress = false

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine
  }

  /**
   * Start sync process
   */
  async startSync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress')
      return
    }

    if (!this.isOnline()) {
      console.log('Device is offline, skipping sync')
      return
    }

    this.syncInProgress = true
    console.log('🔄 Starting sync...')

    try {
      // Get pending transactions
      const pendingTransactions = await offlineDB.getPendingTransactions()
      console.log(`Found ${pendingTransactions.length} pending transactions`)

      // Get pending sync queue
      const pendingQueue = await offlineDB.getPendingSyncQueue()
      console.log(`Found ${pendingQueue.length} pending sync queue items`)

      // Sync transactions
      for (const transaction of pendingTransactions) {
        await this.syncTransaction(transaction)
      }

      // Process sync queue
      for (const queueItem of pendingQueue) {
        await this.processSyncQueueItem(queueItem)
      }

      // Clean up synced data (optional - keep for offline viewing)
      // await offlineDB.clearSyncedData()

      console.log('✅ Sync completed successfully')
    } catch (error) {
      console.error('❌ Sync error:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Sync a single transaction to Supabase
   */
  private async syncTransaction(transaction: OfflineTransaction): Promise<void> {
    try {
      console.log(`Syncing transaction ${transaction.id}...`)

      const supabase = createAuthClient()

      // Check if transaction already exists using client_generated_id (prevent duplicates)
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('client_generated_id', transaction.id)
        .maybeSingle()

      if (existing) {
        console.log(`Transaction ${transaction.id} already exists (client_generated_id), marking as synced`)
        await offlineDB.updateTransactionStatus(transaction.id, 'synced')
        return
      }

      // Generate invoice number for server
      const invoiceNumber = this.generateInvoiceNumber()

      // Insert transaction to Supabase (let server generate auto-increment id)
      const { data: newTransaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          client_generated_id: transaction.id, // Store client UUID for deduplication
          invoice_number: invoiceNumber,
          customer_id: transaction.customerId,
          user_id: transaction.userId,
          total_amount: transaction.totalAmount,
          paid_amount: transaction.paidAmount,
          payment_status: transaction.paidAmount >= transaction.totalAmount ? 'paid' : 
                         transaction.paidAmount > 0 ? 'partial' : 'unpaid',
          order_status: 'processing',
          payment_method: transaction.paymentMethod,
          notes: transaction.notes,
          sync_source: 'offline',
          created_at: transaction.createdAt
        })
        .select()
        .single()

      if (txError) throw txError

      // Insert transaction items using server-generated transaction id
      const itemsToInsert = transaction.items.map(item => ({
        transaction_id: newTransaction.id, // Use server-generated id
        service_id: item.serviceId,
        quantity: item.weight,
        price_at_time: item.pricePerKg,
        subtotal: item.subtotal
      }))

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Mark as synced
      await offlineDB.updateTransactionStatus(transaction.id, 'synced')
      console.log(`✅ Transaction ${transaction.id} synced successfully`)
    } catch (error: any) {
      console.error(`❌ Failed to sync transaction ${transaction.id}:`, error)
      await offlineDB.updateTransactionStatus(
        transaction.id, 
        'failed', 
        error.message
      )
      throw error
    }
  }

  /**
   * Generate invoice number
   */
  private generateInvoiceNumber(): string {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `INV${year}${month}${day}${random}`
  }

  /**
   * Process sync queue item
   */
  private async processSyncQueueItem(item: SyncQueueItem): Promise<void> {
    try {
      console.log(`Processing sync queue item ${item.id}...`)

      // Check max retry attempts
      if (item.attempts >= MAX_RETRY_ATTEMPTS) {
        console.error(`Max retry attempts reached for ${item.id}`)
        await offlineDB.updateSyncQueueItem(item.id, {
          status: 'failed',
          error: 'Max retry attempts exceeded'
        })
        return
      }

      // Update attempts counter
      await offlineDB.updateSyncQueueItem(item.id, {
        attempts: item.attempts + 1,
        lastAttempt: new Date().toISOString()
      })

      // Execute operation based on type
      switch (item.operation) {
        case 'create':
          // Already handled by syncTransaction
          break
        case 'update':
          // Handle update operations
          break
        case 'delete':
          // Handle delete operations
          break
      }

      // Mark as synced
      await offlineDB.updateSyncQueueItem(item.id, {
        status: 'synced'
      })

      // Delete from queue after successful sync
      await offlineDB.deleteSyncQueueItem(item.id)

      console.log(`✅ Sync queue item ${item.id} processed successfully`)
    } catch (error: any) {
      console.error(`❌ Failed to process sync queue item ${item.id}:`, error)
      
      await offlineDB.updateSyncQueueItem(item.id, {
        status: 'failed',
        error: error.message
      })

      // Retry after delay
      if (item.attempts < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          this.processSyncQueueItem(item).catch(console.error)
        }, RETRY_DELAY * (item.attempts + 1))
      }
    }
  }

  /**
   * Manual sync trigger
   */
  async forceSync(): Promise<void> {
    console.log('🔄 Force sync triggered')
    await this.startSync()
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    pendingCount: number
    failedCount: number
    syncedCount: number
  }> {
    const allTransactions = await offlineDB.getAllTransactions()
    
    return {
      pendingCount: allTransactions.filter(t => t.syncStatus === 'pending').length,
      failedCount: allTransactions.filter(t => t.syncStatus === 'failed').length,
      syncedCount: allTransactions.filter(t => t.syncStatus === 'synced').length
    }
  }
}

// Singleton instance
export const syncManager = new SyncManager()

// Auto sync on online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Device is online, starting auto-sync...')
    syncManager.startSync().catch(console.error)
  })

  // Initial sync if online
  if (navigator.onLine) {
    setTimeout(() => {
      syncManager.startSync().catch(console.error)
    }, 2000)
  }
}
