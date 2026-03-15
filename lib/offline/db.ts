// IndexedDB wrapper for offline storage
const DB_NAME = 'laundry_pos_offline'
const DB_VERSION = 1
const STORE_TRANSACTIONS = 'transactions'
const STORE_SYNC_QUEUE = 'sync_queue'

export interface OfflineTransaction {
  id: string // UUID generated on client
  customerId: string
  userId: string
  items: Array<{
    serviceId: string
    serviceName: string
    weight: number
    pricePerKg: number
    subtotal: number
  }>
  totalAmount: number
  paidAmount: number
  paymentMethod: string
  notes?: string
  createdAt: string
  syncStatus: 'pending' | 'synced' | 'failed'
  lastSyncAttempt?: string
  syncError?: string
}

export interface SyncQueueItem {
  id: string
  transactionId: string
  operation: 'create' | 'update' | 'delete'
  data: any
  status: 'pending' | 'synced' | 'failed'
  attempts: number
  lastAttempt?: string
  error?: string
  createdAt: string
}

class OfflineDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create transactions store
        if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
          const transactionStore = db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' })
          transactionStore.createIndex('syncStatus', 'syncStatus', { unique: false })
          transactionStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          const syncQueueStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' })
          syncQueueStore.createIndex('status', 'status', { unique: false })
          syncQueueStore.createIndex('transactionId', 'transactionId', { unique: false })
        }
      }
    })
  }

  // Transaction operations
  async saveTransaction(transaction: OfflineTransaction): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_TRANSACTIONS], 'readwrite')
      const store = tx.objectStore(STORE_TRANSACTIONS)
      const request = store.put(transaction)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getTransaction(id: string): Promise<OfflineTransaction | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_TRANSACTIONS], 'readonly')
      const store = tx.objectStore(STORE_TRANSACTIONS)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllTransactions(): Promise<OfflineTransaction[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_TRANSACTIONS], 'readonly')
      const store = tx.objectStore(STORE_TRANSACTIONS)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_TRANSACTIONS], 'readonly')
      const store = tx.objectStore(STORE_TRANSACTIONS)
      const index = store.index('syncStatus')
      const request = index.getAll('pending')

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async updateTransactionStatus(
    id: string, 
    status: 'pending' | 'synced' | 'failed',
    error?: string
  ): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = await this.getTransaction(id)
    if (!transaction) throw new Error('Transaction not found')

    transaction.syncStatus = status
    transaction.lastSyncAttempt = new Date().toISOString()
    if (error) transaction.syncError = error

    await this.saveTransaction(transaction)
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_TRANSACTIONS], 'readwrite')
      const store = tx.objectStore(STORE_TRANSACTIONS)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Sync queue operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<void> {
    if (!this.db) await this.init()
    
    const queueItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_SYNC_QUEUE], 'readwrite')
      const store = tx.objectStore(STORE_SYNC_QUEUE)
      const request = store.add(queueItem)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_SYNC_QUEUE], 'readonly')
      const store = tx.objectStore(STORE_SYNC_QUEUE)
      const index = store.index('status')
      const request = index.getAll('pending')

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_SYNC_QUEUE], 'readwrite')
      const store = tx.objectStore(STORE_SYNC_QUEUE)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (!item) {
          reject(new Error('Sync queue item not found'))
          return
        }

        const updated = { ...item, ...updates }
        const putRequest = store.put(updated)
        
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_SYNC_QUEUE], 'readwrite')
      const store = tx.objectStore(STORE_SYNC_QUEUE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearSyncedData(): Promise<void> {
    if (!this.db) await this.init()
    
    // Delete synced transactions
    const syncedTransactions = await this.getAllTransactions()
    const synced = syncedTransactions.filter(t => t.syncStatus === 'synced')
    
    for (const transaction of synced) {
      await this.deleteTransaction(transaction.id)
    }

    // Delete synced queue items
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_SYNC_QUEUE], 'readwrite')
      const store = tx.objectStore(STORE_SYNC_QUEUE)
      const index = store.index('status')
      const request = index.openCursor(IDBKeyRange.only('synced'))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
export const offlineDB = new OfflineDB()

// Initialize on load
if (typeof window !== 'undefined') {
  offlineDB.init().catch(console.error)
}
