'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, DollarSign, Calendar, Edit2, Trash2, X, Loader2, TrendingDown, Receipt } from 'lucide-react'
import { 
  getExpenses, 
  getExpenseSummary, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  type ExpenseListItem,
  type ExpenseSummary,
  type CreateExpenseInput,
  type UpdateExpenseInput
} from '@/lib/actions/expenses'

// Expense categories
const EXPENSE_CATEGORIES = [
  'Operasional',
  'Peralatan',
  'Perawatan',
  'Listrik',
  'Air',
  'Lainnya'
] as const

type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedExpense, setSelectedExpense] = useState<ExpenseListItem | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Form states
  const [formData, setFormData] = useState({
    category: 'Operasional' as ExpenseCategory,
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadExpenses()
  }, [searchTerm, categoryFilter])

  async function loadData() {
    await Promise.all([loadExpenses(), loadSummary()])
    setLoading(false)
  }

  async function loadExpenses() {
    const result = await getExpenses({
      search: searchTerm,
      categoryFilter: categoryFilter
    })
    
    if (result.data) {
      setExpenses(result.data)
    }
  }

  async function loadSummary() {
    const result = await getExpenseSummary()
    if (result.data) {
      setSummary(result.data)
    }
  }

  function openAddModal() {
    setModalMode('add')
    setFormData({
      category: 'Operasional',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setShowModal(true)
  }

  function openEditModal(expense: ExpenseListItem) {
    setModalMode('edit')
    setSelectedExpense(expense)
    setFormData({
      category: expense.category as ExpenseCategory,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      notes: expense.notes || ''
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setSelectedExpense(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)

    try {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        showToastMessage('Jumlah harus lebih dari 0')
        setFormLoading(false)
        return
      }

      if (modalMode === 'add') {
        const input: CreateExpenseInput = {
          category: formData.category,
          description: formData.description,
          amount: amount,
          date: formData.date,
          notes: formData.notes || undefined
        }
        const result = await createExpense(input)
        if (result.success) {
          showToastMessage('✅ Pengeluaran berhasil ditambahkan')
          closeModal()
          loadData()
        } else {
          showToastMessage('❌ ' + (result.error || 'Gagal menambah pengeluaran'))
        }
      } else if (selectedExpense) {
        const input: UpdateExpenseInput = {
          id: selectedExpense.id,
          category: formData.category,
          description: formData.description,
          amount: amount,
          date: formData.date,
          notes: formData.notes || undefined
        }
        const result = await updateExpense(input)
        if (result.success) {
          showToastMessage('✅ Pengeluaran berhasil diupdate')
          closeModal()
          loadData()
        } else {
          showToastMessage('❌ ' + (result.error || 'Gagal update pengeluaran'))
        }
      }
    } catch (error) {
      showToastMessage('❌ Terjadi kesalahan')
    }

    setFormLoading(false)
  }

  async function handleDelete(id: string, description: string) {
    if (!confirm(`Hapus pengeluaran "${description}"?`)) {
      return
    }

    const result = await deleteExpense(id)
    if (result.success) {
      showToastMessage('✅ Pengeluaran berhasil dihapus')
      loadData()
    } else {
      showToastMessage('❌ ' + (result.error || 'Gagal menghapus pengeluaran'))
    }
  }

  function showToastMessage(message: string) {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      'Operasional': 'bg-blue-100 text-blue-700',
      'Peralatan': 'bg-purple-100 text-purple-700',
      'Perawatan': 'bg-green-100 text-green-700',
      'Listrik': 'bg-yellow-100 text-yellow-700',
      'Air': 'bg-cyan-100 text-cyan-700',
      'Lainnya': 'bg-slate-100 text-slate-700'
    }
    return colors[category] || colors['Lainnya']
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header - Mobile */}
      <div className="md:hidden">
        <h2 className="text-xl font-bold text-slate-900">Pengeluaran</h2>
        <p className="text-sm text-slate-600 mt-0.5">Catat pengeluaran operasional</p>
      </div>

      {/* Header - Desktop */}
      <div className="hidden md:flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pengeluaran</h2>
          <p className="text-slate-600 mt-1">Catat dan kelola pengeluaran operasional</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          Tambah Pengeluaran
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* Today Total */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg md:rounded-xl shadow-md p-3 md:p-5 text-white">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <TrendingDown size={16} className="md:w-5 md:h-5" />
            <p className="text-xs md:text-sm text-red-100">Hari Ini</p>
          </div>
          <p className="text-lg md:text-2xl font-bold">Rp {(summary?.todayTotal || 0).toLocaleString('id-ID')}</p>
          <p className="text-xs md:text-sm text-red-100 mt-1">{summary?.todayCount || 0} transaksi</p>
        </div>

        {/* Month Total */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg md:rounded-xl shadow-md p-3 md:p-5 text-white">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <Receipt size={16} className="md:w-5 md:h-5" />
            <p className="text-xs md:text-sm text-orange-100">Bulan Ini</p>
          </div>
          <p className="text-lg md:text-2xl font-bold">Rp {(summary?.monthTotal || 0).toLocaleString('id-ID')}</p>
          <p className="text-xs md:text-sm text-orange-100 mt-1">{summary?.monthCount || 0} transaksi</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-100 p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari pengeluaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 md:py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:w-48"
          >
            <option value="all">Semua Kategori</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses List - Mobile (Cards) */}
      <div className="md:hidden space-y-3">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <DollarSign size={48} className="mx-auto mb-2 opacity-50" />
            <p>Belum ada pengeluaran</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white rounded-lg shadow-sm border border-slate-100 p-3"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 text-sm line-clamp-1">
                    {expense.description}
                  </h3>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${getCategoryColor(expense.category)}`}>
                    {expense.category}
                  </span>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => openEditModal(expense)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id, expense.description)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1 text-slate-500">
                  <Calendar size={14} />
                  <span>{new Date(expense.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <span className="font-bold text-red-600">
                  Rp {Number(expense.amount).toLocaleString('id-ID')}
                </span>
              </div>

              {expense.notes && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {expense.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Expenses List - Desktop (Table) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Deskripsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Catatan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Jumlah</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <DollarSign size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Belum ada pengeluaran</p>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(expense.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-medium">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-slate-500 truncate">{expense.notes || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-red-600">
                        Rp {Number(expense.amount).toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id, expense.description)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
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

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={openAddModal}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition z-10"
      >
        <Plus size={24} />
      </button>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            className="bg-white w-full md:max-w-lg md:rounded-xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === 'add' ? 'Tambah Pengeluaran' : 'Edit Pengeluaran'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Pengeluaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Misal: Beli deterjen"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Jumlah Uang <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="1000"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Catatan (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Catatan tambahan..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading && <Loader2 size={18} className="animate-spin" />}
                  {modalMode === 'add' ? 'Simpan' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
