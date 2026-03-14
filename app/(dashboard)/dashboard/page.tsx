'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Loader2
} from 'lucide-react'
import { getDashboardStats, type DashboardStats } from '@/lib/actions/dashboard'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getDashboardStats()
      
      if (result.error) {
        setError(result.error)
      } else {
        setStats(result.data)
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err)
      setError(err.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium mb-2">Gagal memuat data</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-slate-500 py-12">
        Tidak ada data tersedia
      </div>
    )
  }

  const cards = [
    {
      label: 'Laundry Masuk',
      sublabel: 'Hari Ini',
      value: stats.laundryMasuk,
      icon: PackageCheck,
      color: 'bg-blue-500',
      bgGradient: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Sedang Diproses',
      sublabel: 'Total',
      value: stats.laundryDiproses,
      icon: Clock,
      color: 'bg-amber-500',
      bgGradient: 'from-amber-500 to-amber-600'
    },
    {
      label: 'Laundry Selesai',
      sublabel: 'Siap Diambil',
      value: stats.laundrySelesai,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      bgGradient: 'from-emerald-500 to-emerald-600'
    },
    {
      label: 'Belum Diambil',
      sublabel: 'Total',
      value: stats.belumDiambil,
      icon: AlertCircle,
      color: 'bg-orange-500',
      bgGradient: 'from-orange-500 to-orange-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm md:text-base text-slate-600 mt-1">Overview operasional hari ini</p>
      </div>

      {/* Pendapatan Card - Full Width */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={20} />
              <p className="text-emerald-100 text-sm font-medium">Pendapatan Hari Ini</p>
            </div>
            <p className="text-3xl md:text-4xl font-bold mb-1">
              Rp {stats.pendapatanHariIni.toLocaleString('id-ID')}
            </p>
            <div className="flex items-center gap-1 text-emerald-100 text-sm">
              <TrendingUp size={16} />
              <span>Transaksi: {stats.laundryMasuk}</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign size={40} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards - Horizontal Scroll on Mobile */}
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-3">Status Laundry</h3>
        <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {cards.map((card, index) => (
            <div 
              key={index} 
              className="min-w-[160px] md:min-w-0 bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.bgGradient} flex items-center justify-center mb-3`}>
                <card.icon size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {card.value}
              </div>
              <div className="text-sm font-medium text-slate-700">{card.label}</div>
              <div className="text-xs text-slate-500">{card.sublabel}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertCircle className="text-blue-600" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-1">Info Penting</p>
            <p className="text-sm text-blue-700">
              {stats.laundryDiproses > 0 
                ? `Ada ${stats.laundryDiproses} pesanan yang sedang diproses`
                : 'Tidak ada pesanan yang sedang diproses'}
            </p>
            {stats.belumDiambil > 0 && (
              <p className="text-sm text-blue-700 mt-1">
                {stats.belumDiambil} pesanan sudah selesai dan siap diambil
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
