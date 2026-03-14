'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('name')
    
    if (data) setServices(data)
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Layanan</h2>
          <p className="text-slate-600 mt-1">Kelola jenis dan harga layanan laundry</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={20} />
          Tambah Layanan
        </button>
      </div>

      {/* Grid of Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-lg">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                )}
              </div>
              <button>
                {service.active ? (
                  <ToggleRight className="text-emerald-600" size={24} />
                ) : (
                  <ToggleLeft className="text-slate-400" size={24} />
                )}
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Harga</span>
                <span className="font-semibold text-emerald-600">
                  Rp {Number(service.price).toLocaleString('id-ID')} / {service.price_type}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Estimasi</span>
                <span className="font-medium text-slate-900">{service.estimation_days} hari</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-2">
                <Edit2 size={16} />
                Edit
              </button>
              <button className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2">
                <Trash2 size={16} />
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
