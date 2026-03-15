'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import { syncManager } from '@/lib/offline/sync'
import { offlineDB } from '@/lib/offline/db'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState({ 
    pendingCount: 0, 
    failedCount: 0,
    syncedCount: 0 
  })
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine)

    // Listen to online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-trigger sync
      handleSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load sync status
    loadSyncStatus()

    // Periodic sync status check
    const interval = setInterval(loadSyncStatus, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const loadSyncStatus = async () => {
    try {
      const status = await syncManager.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error('Failed to load sync status:', error)
    }
  }

  const handleSync = async () => {
    if (!isOnline) {
      alert('⚠️ Tidak ada koneksi internet')
      return
    }

    try {
      setIsSyncing(true)
      await syncManager.forceSync()
      await loadSyncStatus()
      alert('✅ Sync berhasil!')
    } catch (error) {
      console.error('Sync error:', error)
      alert('❌ Sync gagal. Silakan coba lagi.')
    } finally {
      setIsSyncing(false)
    }
  }

  const hasPendingData = syncStatus.pendingCount > 0 || syncStatus.failedCount > 0

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main Status Badge */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
          isOnline 
            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
        <span className="font-medium text-sm">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {hasPendingData && (
          <span className="bg-white text-emerald-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {syncStatus.pendingCount + syncStatus.failedCount}
          </span>
        )}
      </button>

      {/* Details Panel */}
      {showDetails && (
        <div className="absolute bottom-14 right-0 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-4 space-y-3">
          {/* Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Status Koneksi</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className={`flex items-center gap-2 ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
              <span className="text-sm font-medium">
                {isOnline ? 'Terhubung ke internet' : 'Tidak ada koneksi'}
              </span>
            </div>
          </div>

          {/* Sync Status */}
          <div className="border-t border-slate-200 pt-3">
            <div className="text-sm text-slate-900 font-semibold mb-2">Data Sync:</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Menunggu sync:</span>
                <span className={`font-semibold ${syncStatus.pendingCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {syncStatus.pendingCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Gagal sync:</span>
                <span className={`font-semibold ${syncStatus.failedCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {syncStatus.failedCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tersinkronisasi:</span>
                <span className="font-semibold text-emerald-600">
                  {syncStatus.syncedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Sync Button */}
          {isOnline && hasPendingData && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span className="text-sm font-medium">
                {isSyncing ? 'Syncing...' : 'Sync Sekarang'}
              </span>
            </button>
          )}

          {/* Offline Notice */}
          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                Data akan tersimpan secara lokal dan otomatis sync saat online kembali.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
