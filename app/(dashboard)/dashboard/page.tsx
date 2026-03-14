'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  AlertCircle,
  Package
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

interface DashboardStats {
  transactionsToday: number
  incomeToday: number
  expenseToday: number
  profitToday: number
  totalUnpaid: number
  totalCustomers: number
  totalPending: number
  incomeChart: { date: string; total: number }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      const transactionsToday = transactions?.filter(t => 
        t.created_at.startsWith(today)
      ).length || 0

      const incomeToday = transactions
        ?.filter(t => t.created_at.startsWith(today))
        .reduce((sum, t) => sum + Number(t.paid_amount), 0) || 0

      const expenseToday = expenses
        ?.filter(e => e.date === today)
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0

      const totalUnpaid = transactions
        ?.filter(t => t.payment_status !== 'paid')
        .reduce((sum, t) => sum + (Number(t.total_amount) - Number(t.paid_amount)), 0) || 0

      const totalPending = transactions
        ?.filter(t => t.order_status === 'processing')
        .length || 0

      // Last 7 days chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })

      const incomeChart = last7Days.map(date => {
        const total = transactions
          ?.filter(t => t.created_at.startsWith(date))
          .reduce((sum, t) => sum + Number(t.paid_amount), 0) || 0
        return { date, total }
      })

      setStats({
        transactionsToday,
        incomeToday,
        expenseToday,
        profitToday: incomeToday - expenseToday,
        totalUnpaid,
        totalCustomers: customersCount || 0,
        totalPending,
        incomeChart
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
        <p className="mt-4 text-slate-500">Memuat dashboard...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-red-500">
        Gagal memuat data dashboard
      </div>
    )
  }

  const cards = [
    {
      label: 'Pendapatan Hari Ini',
      value: `Rp ${stats.incomeToday.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: `Profit: Rp ${stats.profitToday.toLocaleString('id-ID')}`
    },
    {
      label: 'Transaksi Hari Ini',
      value: stats.transactionsToday,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: `${stats.totalPending} sedang diproses`
    },
    {
      label: 'Total Pelanggan',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: 'Terdaftar di sistem'
    },
    {
      label: 'Belum Lunas',
      value: `Rp ${stats.totalUnpaid.toLocaleString('id-ID')}`,
      icon: AlertCircle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: 'Perlu ditagih'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-600 mt-1">Overview kinerja laundry Anda hari ini</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon size={24} className={card.textColor} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp size={16} className="text-emerald-500 mr-1" />
              <span className="text-slate-600">{card.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Grafik Pendapatan (7 Hari Terakhir)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.incomeChart}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Ringkasan Keuangan</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Pemasukan Hari Ini</span>
                <span className="font-medium text-emerald-600">
                  Rp {stats.incomeToday.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Pengeluaran Hari Ini</span>
                <span className="font-medium text-red-600">
                  Rp {stats.expenseToday.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Profit Hari Ini</span>
                <span className={`text-lg font-bold ${stats.profitToday >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  Rp {stats.profitToday.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Package className="text-slate-400" size={18} />
                <div>
                  <p className="font-medium">{stats.totalPending} Order Diproses</p>
                  <p className="text-xs text-slate-500">Sedang dalam pengerjaan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
