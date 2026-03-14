'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Loader2, DollarSign, Calendar, Package } from 'lucide-react'
import { getServices, createService, updateService, deleteService, type Service } from '@/lib/actions/services'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    price_type: 'kg',
    estimation_days: '3'
  })

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    try {
      setLoading(true)
      const result = await getServices()
      
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.data) {
        setServices(result.data)
      }
    } catch (error) {
      console.error('Error loading services:', error)
      showToast('Gagal memuat data layanan', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const result = await createService({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        price_type: formData.price_type,
        estimation_days: parseInt(formData.estimation_days)
      })
      
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Layanan berhasil ditambahkan', 'success')
        setShowAddModal(false)
        resetForm()
        loadServices()
      }
    } catch (error) {
      showToast('Gagal menambahkan layanan', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditService(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService) return

    setSaving(true)

    try {
      const result = await updateService(selectedService.id, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        price_type: formData.price_type,
        estimation_days: parseInt(formData.estimation_days)
      })
      
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Layanan berhasil diperbarui', 'success')
        setShowEditModal(false)
        setSelectedService(null)
        resetForm()
        loadServices()
      }
    } catch (error) {
      showToast('Gagal memperbarui layanan', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteService(service: Service) {
    if (!confirm(`Hapus layanan "${service.name}"?`)) return

    try {
      const result = await deleteService(service.id)
      
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Layanan berhasil dihapus', 'success')
        loadServices()
      }
    } catch (error) {
      showToast('Gagal menghapus layanan', 'error')
    }
  }

  function openEditModal(service: Service) {
    setSelectedService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      price_type: service.price_type,
      estimation_days: service.estimation_days.toString()
    })
    setShowEditModal(true)
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      price_type: 'kg',
      estimation_days: '3'
    })
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat layanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Layanan</h2>
          <p className="text-sm md:text-base text-slate-600 mt-1">Kelola jenis layanan laundry</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          <Plus size={20} />
          Tambah
        </button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {services.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            <Package size={48} className="mx-auto mb-3 opacity-50" />
            <p>Tidak ada layanan</p>
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              {/* Header */}
              <div className="mb-3">
                <div className="font-semibold text-slate-900 text-base mb-1">{service.name}</div>
                {service.description && (
                  <div className="text-sm text-slate-600 line-clamp-2">{service.description}</div>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mb-1">
                    <DollarSign size={14} />
                    Harga
                  </div>
                  <div className="font-bold text-emerald-600">
                    Rp {Number(service.price).toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-emerald-600 mt-0.5">per {service.price_type}</div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium mb-1">
                    <Calendar size={14} />
                    Estimasi
                  </div>
                  <div className="font-bold text-blue-600">
                    {service.estimation_days} hari
                  </div>
                  <div className="text-xs text-blue-600 mt-0.5">pengerjaan</div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEditModal(service)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteService(service)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-12 text-center text-slate-500">
            <Package size={64} className="mx-auto mb-4 opacity-50" />
            <p>Tidak ada layanan</p>
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 text-lg mb-1">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                    <DollarSign size={16} />
                    Harga
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">
                      Rp {Number(service.price).toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-emerald-600">per {service.price_type}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                    <Calendar size={16} />
                    Estimasi
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{service.estimation_days} hari</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(service)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteService(service)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button - Mobile Only */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 flex items-center justify-center z-30 active:scale-95 transition"
      >
        <Plus size={24} />
      </button>

      {/* Modal: Add Service */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-xl w-full md:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-xl">
              <h3 className="text-xl font-bold">Tambah Layanan</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Layanan *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Cuci Setrika"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Deskripsi layanan"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Harga *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Satuan *</label>
                  <select
                    value={formData.price_type}
                    onChange={(e) => setFormData({...formData, price_type: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kg">per Kg</option>
                    <option value="pcs">per Pcs</option>
                    <option value="unit">per Unit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Estimasi Pengerjaan *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    max="30"
                    value={formData.estimation_days}
                    onChange={(e) => setFormData({...formData, estimation_days: e.target.value})}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-600 font-medium">hari</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
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

      {/* Modal: Edit Service */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-xl w-full md:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-xl">
              <h3 className="text-xl font-bold">Edit Layanan</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedService(null)
                  resetForm()
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditService} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Layanan *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Harga *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Satuan *</label>
                  <select
                    value={formData.price_type}
                    onChange={(e) => setFormData({...formData, price_type: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kg">per Kg</option>
                    <option value="pcs">per Pcs</option>
                    <option value="unit">per Unit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Estimasi Pengerjaan *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    max="30"
                    value={formData.estimation_days}
                    onChange={(e) => setFormData({...formData, estimation_days: e.target.value})}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-600 font-medium">hari</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedService(null)
                    resetForm()
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
