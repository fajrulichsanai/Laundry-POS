'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, Package, Printer, Send, Eye, Loader2 } from 'lucide-react'
import { getTransactions, getTransactionDetail, type TransactionListItem } from '@/lib/actions/transactions'
import { printReceipt, sendWhatsApp, type ReceiptData } from '@/lib/utils/receipt'

interface TransactionDetail {
  id: string
  invoice_number: string
  customer_id: string
  total_amount: number
  paid_amount: number
  payment_status: 'unpaid' | 'partial' | 'paid'
  order_status: 'processing' | 'done' | 'taken'
  payment_method: string | null
  notes: string | null
  created_at: string
  customer: {
    name: string
    phone: string
    address?: string
  } | null
  items?: Array<{
    service_name: string
    quantity: number
    price_at_time: number
    subtotal: number
  }>
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    try {
      setLoading(true)
      const result = await getTransactions({ search: searchTerm, statusFilter })
      
      if (result.error) {
        console.error('Error:', result.error)
      } else if (result.data) {
        setTransactions(result.data)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    loadTransactions()
  }

  async function handleFilterChange(status: string) {
    setStatusFilter(status)
    setShowFilter(false)
    const result = await getTransactions({ search: searchTerm, statusFilter: status })
    if (result.data) {
      setTransactions(result.data)
    }
  }

  async function loadTransactionDetails(transactionId: string) {
    try {
      const result = await getTransactionDetail(transactionId)
      
      if (result.error) {
        alert('Gagal memuat detail transaksi: ' + result.error)
      } else if (result.data) {
        setSelectedTransaction(result.data as TransactionDetail)
      }
    } catch (error) {
      console.error('Error loading transaction details:', error)
      alert('Gagal memuat detail transaksi')
    }
  }

  function handlePrintReceipt(transaction: TransactionListItem | TransactionDetail) {
    const items = 'items' in transaction && transaction.items
      ? transaction.items.map(item => ({
          serviceName: item.service_name,
          weight: item.quantity,
          pricePerKg: item.price_at_time,
          subtotal: item.subtotal
        }))
      : []
    
    const createdAt = new Date(transaction.created_at)
    const estimatedCompletion = new Date(createdAt)
    estimatedCompletion.setDate(createdAt.getDate() + 3) // Default 3 hari
    
    const receiptData: ReceiptData = {
      invoiceNumber: transaction.invoice_number,
      customerName: transaction.customer?.name || 'Unknown',
      customerPhone: transaction.customer?.phone || '-',
      items,
      totalAmount: transaction.total_amount,
      paidAmount: transaction.paid_amount,
      remaining: transaction.total_amount - transaction.paid_amount,
      paymentMethod: transaction.payment_method || 'cash',
      createdAt,
      estimatedCompletion
    }
    printReceipt(receiptData)
  }

  function handleSendWhatsApp(transaction: TransactionListItem | TransactionDetail) {
    const items = 'items' in transaction && transaction.items
      ? transaction.items.map(item => ({
          serviceName: item.service_name,
          weight: item.quantity,
          pricePerKg: item.price_at_time,
          subtotal: item.subtotal
        }))
      : []
    
    const createdAt = new Date(transaction.created_at)
    const estimatedCompletion = new Date(createdAt)
    estimatedCompletion.setDate(createdAt.getDate() + 3) // Default 3 hari
    
    const receiptData: ReceiptData = {
      invoiceNumber: transaction.invoice_number,
      customerName: transaction.customer?.name || 'Unknown',
      customerPhone: transaction.customer?.phone || '-',
      items,
      totalAmount: transaction.total_amount,
      paidAmount: transaction.paid_amount,
      remaining: transaction.total_amount - transaction.paid_amount,
      paymentMethod: transaction.payment_method || 'cash',
      createdAt,
      estimatedCompletion
    }
    sendWhatsApp(receiptData)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-emerald-100 text-emerald-700',
      partial: 'bg-yellow-100 text-yellow-700',
      unpaid: 'bg-red-100 text-red-700',
      processing: 'bg-blue-100 text-blue-700',
      done: 'bg-emerald-100 text-emerald-700',
      taken: 'bg-slate-100 text-slate-700',
    }
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-700'
  }

  const getStatusLabel = (status: string, type: 'payment' | 'order') => {
    if (type === 'payment') {
      const labels = { paid: 'Lunas', partial: 'DP', unpaid: 'Belum Bayar' }
      return labels[status as keyof typeof labels] || status
    } else {
      const labels = { processing: 'Diproses', done: 'Selesai', taken: 'Diambil' }
      return labels[status as keyof typeof labels] || status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat transaksi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Riwayat Transaksi</h2>
        <p className="text-sm md:text-base text-slate-600 mt-1">Kelola dan lacak semua transaksi</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 space-y-3">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cari invoice, nama, atau HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm"
          >
            Cari
          </button>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2 text-sm font-medium"
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Filter Options */}
        {showFilter && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => handleFilterChange('processing')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === 'processing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Diproses
            </button>
            <button
              onClick={() => handleFilterChange('done')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === 'done'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Selesai
            </button>
            <button
              onClick={() => handleFilterChange('taken')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === 'taken'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Diambil
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            <Package size={48} className="mx-auto mb-3 opacity-50" />
            <p>Tidak ada transaksi</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-sm font-bold text-slate-900">{transaction.invoice_number}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(transaction.payment_status)}`}>
                    {getStatusLabel(transaction.payment_status, 'payment')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(transaction.order_status)}`}>
                    {getStatusLabel(transaction.order_status, 'order')}
                  </span>
                </div>
              </div>

              {/* Customer */}
              <div className="mb-3 pb-3 border-b border-slate-100">
                <div className="font-semibold text-slate-900">{transaction.customer?.name}</div>
                <div className="text-sm text-slate-600">{transaction.customer?.phone}</div>
              </div>

              {/* Amount */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Total</span>
                  <span className="font-bold text-slate-900">Rp {Number(transaction.total_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Dibayar</span>
                  <span className="font-semibold text-emerald-600">Rp {Number(transaction.paid_amount).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => loadTransactionDetails(transaction.id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs font-medium"
                >
                  <Eye size={14} />
                  Detail
                </button>
                <button
                  onClick={() => handlePrintReceipt(transaction)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 text-xs font-medium"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button
                  onClick={() => handleSendWhatsApp(transaction)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-xs font-medium"
                >
                  <Send size={14} />
                  WA
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pelanggan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Package size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Tidak ada transaksi</p>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-slate-900">
                        {transaction.invoice_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 text-sm">{transaction.customer?.name}</div>
                      <div className="text-xs text-slate-500">{transaction.customer?.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">
                        Rp {Number(transaction.total_amount).toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs text-emerald-600">
                        Dibayar: Rp {Number(transaction.paid_amount).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(transaction.payment_status)}`}>
                          {getStatusLabel(transaction.payment_status, 'payment')}
                        </span>
                        <br />
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(transaction.order_status)}`}>
                          {getStatusLabel(transaction.order_status, 'order')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => loadTransactionDetails(transaction.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(transaction)}
                          className="p-1.5 text-slate-600 hover:bg-slate-50 rounded"
                          title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleSendWhatsApp(transaction)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="WhatsApp"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Transaction Detail */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Detail Pesanan</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice & Status */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500">Nomor Invoice</div>
                  <div className="font-mono text-xl font-bold text-slate-900">
                    {selectedTransaction.invoice_number}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {new Date(selectedTransaction.created_at).toLocaleString('id-ID', {
                      dateStyle: 'long',
                      timeStyle: 'short'
                    })}
                  </div>
                </div>
                <div className="flex md:flex-col gap-2">
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedTransaction.payment_status)}`}>
                    {getStatusLabel(selectedTransaction.payment_status, 'payment')}
                  </span>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedTransaction.order_status)}`}>
                    {getStatusLabel(selectedTransaction.order_status, 'order')}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm font-medium text-slate-500 mb-2">Informasi Pelanggan</div>
                <div className="font-semibold text-slate-900">{selectedTransaction.customer?.name}</div>
                <div className="text-sm text-slate-600">{selectedTransaction.customer?.phone}</div>
                {selectedTransaction.customer?.address && (
                  <div className="text-sm text-slate-600 mt-1">{selectedTransaction.customer.address}</div>
                )}
              </div>

              {/* Items */}
              <div>
                <div className="text-sm font-medium text-slate-500 mb-3">Detail Layanan</div>
                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTransaction.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{item.service_name}</div>
                          <div className="text-sm text-slate-600">
                            {item.quantity} kg × Rp {Number(item.price_at_time).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="font-semibold text-slate-900">
                          Rp {Number(item.subtotal).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Belum ada item</p>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Total</span>
                  <span className="font-semibold">Rp {Number(selectedTransaction.total_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Dibayar</span>
                  <span className="font-semibold">Rp {Number(selectedTransaction.paid_amount).toLocaleString('id-ID')}</span>
                </div>
                {Number(selectedTransaction.total_amount) > Number(selectedTransaction.paid_amount) && (
                  <div className="flex justify-between text-orange-600 font-semibold">
                    <span>Sisa</span>
                    <span>Rp {(Number(selectedTransaction.total_amount) - Number(selectedTransaction.paid_amount)).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              {selectedTransaction.payment_method && (
                <div className="text-sm">
                  <span className="text-slate-500">Metode Pembayaran: </span>
                  <span className="font-medium text-slate-900">
                    {selectedTransaction.payment_method === 'cash' ? 'Tunai' :
                     selectedTransaction.payment_method === 'qris' ? 'QRIS' :
                     selectedTransaction.payment_method === 'transfer' ? 'Transfer' :
                     selectedTransaction.payment_method === 'e-wallet' ? 'E-Wallet' :
                     selectedTransaction.payment_method}
                  </span>
                </div>
              )}

              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-900 mb-1">Catatan</div>
                  <div className="text-sm text-yellow-800">{selectedTransaction.notes}</div>
                </div>
              )}

              {/* Actions in Modal */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintReceipt(selectedTransaction)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                >
                  <Printer size={18} />
                  Print Struk
                </button>
                <button
                  onClick={() => handleSendWhatsApp(selectedTransaction)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Send size={18} />
                  Kirim WA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
