'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, DollarSign, User, Phone, Mail, X, Loader2, Eye, Edit2, CreditCard } from 'lucide-react'
import { getCustomers, createCustomer, updateCustomer, topUpBalance, getCustomerTransactions, type Customer } from '@/lib/actions/customers'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    try {
      setLoading(true)
      const result = await getCustomers()
      
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.data) {
        setCustomers(result.data)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      showToast('Gagal memuat data pelanggan', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    if (searchTerm.trim() === '') {
      loadCustomers()
      return
    }

    try {
      const result = await getCustomers(searchTerm)
      if (result.data) {
        setCustomers(result.data)
      }
    } catch (error) {
      console.error('Error searching customers:', error)
    }
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const result = await createCustomer(formData)
      
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Pelanggan berhasil ditambahkan', 'success')
        setShowAddModal(false)
        setFormData({ name: '', phone: '', email: '', address: '' })
        loadCustomers()
      }
    } catch (error) {
      showToast('Gagal menambahkan pelanggan', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCustomer) return

    setSaving(true)

    try {
      const result = await updateCustomer(selectedCustomer.id, formData)
      
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Pelanggan berhasil diperbarui', 'success')
        setShowEditModal(false)
        setSelectedCustomer(null)
        setFormData({ name: '', phone: '', email: '', address: '' })
        loadCustomers()
      }
    } catch (error) {
      showToast('Gagal memperbarui pelanggan', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCustomer) return

    const amount = parseFloat(topUpAmount)
    if (isNaN(amount) || amount <= 0) {
      showToast('Jumlah top-up tidak valid', 'error')
      return
    }

    setSaving(true)

    try {
      const result = await topUpBalance(selectedCustomer.id, amount)
      
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast(`Top-up Rp ${amount.toLocaleString('id-ID')} berhasil`, 'success')
        setShowTopUpModal(false)
        setSelectedCustomer(null)
        setTopUpAmount('')
        loadCustomers()
      }
    } catch (error) {
      showToast('Gagal melakukan top-up', 'error')
    } finally {
      setSaving(false)
    }
  }

  function openTopUpModal(customer: Customer) {
    setSelectedCustomer(customer)
    setTopUpAmount('')
    setShowTopUpModal(true)
  }

  function openEditModal(customer: Customer) {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || ''
    })
    setShowEditModal(true)
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  const filteredCustomers = searchTerm.trim() === '' 
    ? customers 
    : customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat data pelanggan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Pelanggan</h2>
          <p className="text-sm md:text-base text-slate-600 mt-1">Kelola data pelanggan laundry</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          <Plus size={20} />
          Tambah
        </button>
      </div>

      {/* Search Bar - Sticky on Mobile */}
      <div className="sticky top-0 z-10 bg-slate-50 -mx-4 px-4 py-2 md:static md:bg-transparent md:mx-0 md:px-0 md:py-0">
        <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 border border-slate-100">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Cari nama atau HP..."
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
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            <User size={48} className="mx-auto mb-3 opacity-50" />
            <p>Tidak ada pelanggan</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-base">{customer.name}</div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-1">
                    <Phone size={14} />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Mail size={12} />
                      <span>{customer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Balance */}
              <div className="bg-emerald-50 rounded-lg p-3 mb-3">
                <div className="text-xs text-emerald-700 font-medium mb-0.5">Saldo</div>
                <div className="text-xl font-bold text-emerald-600">
                  Rp {Number(customer.balance).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openTopUpModal(customer)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm font-medium"
                >
                  <CreditCard size={16} />
                  Top Up
                </button>
                <button
                  onClick={() => openEditModal(customer)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                >
                  <Edit2 size={16} />
                  Edit
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
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kontak</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Saldo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bergabung</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <User size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Tidak ada pelanggan</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{customer.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Phone size={14} />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Mail size={12} />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${Number(customer.balance) > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                        Rp {Number(customer.balance).toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(customer.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openTopUpModal(customer)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Top Up"
                        >
                          <CreditCard size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
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

      {/* Floating Action Button - Mobile Only */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 flex items-center justify-center z-30 active:scale-95 transition"
      >
        <Plus size={24} />
      </button>

      {/* Modal: Add Customer */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-xl w-full md:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Tambah Pelanggan</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">No. HP *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="08123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Alamat lengkap"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-xl w-full md:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit Pelanggan</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedCustomer(null)
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">No. HP *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedCustomer(null)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Menyimpan...
                    </>
                  ) : (
                    'Perbarui'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Top Up Balance */}
      {showTopUpModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-xl w-full md:max-w-md">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-xl">
              <h3 className="text-xl font-bold">Top Up Saldo</h3>
              <button
                onClick={() => {
                  setShowTopUpModal(false)
                  setSelectedCustomer(null)
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleTopUp} className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="font-semibold text-slate-900 mb-1">{selectedCustomer.name}</div>
                <div className="text-sm text-slate-600">{selectedCustomer.phone}</div>
              </div>

              {/* Current Balance */}
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="text-sm text-emerald-700 font-medium mb-1">Saldo Sekarang</div>
                <div className="text-2xl font-bold text-emerald-600">
                  Rp {Number(selectedCustomer.balance).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Top Up Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Jumlah Top Up *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  step="1000"
                  min="1000"
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  placeholder="0"
                />
                
                {/* Quick Amounts */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[50000, 100000, 200000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTopUpAmount(amount.toString())}
                      className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
                    >
                      {amount/1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* New Balance Preview */}
              {topUpAmount && parseFloat(topUpAmount) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700 font-medium mb-1">Saldo Setelah Top Up</div>
                  <div className="text-xl font-bold text-blue-600">
                    Rp {(Number(selectedCustomer.balance) + parseFloat(topUpAmount)).toLocaleString('id-ID')}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTopUpModal(false)
                    setSelectedCustomer(null)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || !topUpAmount || parseFloat(topUpAmount) <= 0}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Proses...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Top Up
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
