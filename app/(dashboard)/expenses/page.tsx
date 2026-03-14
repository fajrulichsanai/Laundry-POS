'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Expense } from '@/types'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .limit(50)
    
    if (data) setExpenses(data)
    setLoading(false)
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pengeluaran</h2>
          <p className="text-slate-600 mt-1">Catat dan kelola pengeluaran operasional</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={20} />
          Tambah Pengeluaran
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm">Total Pengeluaran</p>
            <p className="text-3xl font-bold mt-1">Rp {totalExpenses.toLocaleString('id-ID')}</p>
          </div>
          <Calendar size={48} className="text-red-200" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Deskripsi</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(expense.date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-red-600">
                      Rp {Number(expense.amount).toLocaleString('id-ID')}
                    </span>
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
