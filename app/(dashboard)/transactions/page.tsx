'use client'

import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Transaction } from '@/types'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        customer:customers(name, phone),
        user:users(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) setTransactions(data)
    setLoading(false)
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

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h2>
          <p className="text-slate-600 mt-1">Kelola dan lacak semua transaksi</p>
        </div>
        <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2">
          <Filter size={20} />
          Filter
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cari berdasarkan nomor invoice atau nama pelanggan..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pelanggan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status Bayar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.map((transaction: any) => (
                <tr key={transaction.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-medium text-slate-900">
                      {transaction.invoice_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-slate-900">{transaction.customer?.name}</div>
                      <div className="text-sm text-slate-500">{transaction.customer?.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      Rp {Number(transaction.total_amount).toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-slate-500">
                      Dibayar: Rp {Number(transaction.paid_amount).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(transaction.payment_status)}`}>
                      {transaction.payment_status === 'paid' && 'Lunas'}
                      {transaction.payment_status === 'partial' && 'Sebagian'}
                      {transaction.payment_status === 'unpaid' && 'Belum Bayar'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(transaction.order_status)}`}>
                      {transaction.order_status === 'processing' && 'Diproses'}
                      {transaction.order_status === 'done' && 'Selesai'}
                      {transaction.order_status === 'taken' && 'Diambil'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
