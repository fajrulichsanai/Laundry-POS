'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Download,
  Calendar,
  Loader2
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  getReportSummary,
  getDailyRevenue,
  getMonthlyRevenue,
  getServicePopularity,
  getTopCustomers,
  getOrderStatus,
  getExpensesByCategory,
  getTransactionDetails,
  getTransactionSummary,
  getExpenseDetails,
  type ReportSummary,
  type DailyRevenue,
  type MonthlyRevenue,
  type ServicePopularity,
  type TopCustomer,
  type OrderStatus,
  type ExpenseByCategory
} from '@/lib/actions/reports'
import * as XLSX from 'xlsx'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

type DateFilter = 'today' | 'week' | 'month' | 'custom'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  
  // Export dialog states
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  
  // Data states
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [servicePopularity, setServicePopularity] = useState<ServicePopularity[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [orderStatus, setOrderStatus] = useState<OrderStatus[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    const [
      summaryRes,
      dailyRevenueRes,
      monthlyRevenueRes,
      servicePopularityRes,
      topCustomersRes,
      orderStatusRes,
      expensesByCategoryRes
    ] = await Promise.all([
      getReportSummary(),
      getDailyRevenue(30),
      getMonthlyRevenue(),
      getServicePopularity(10),
      getTopCustomers(10),
      getOrderStatus(),
      getExpensesByCategory()
    ])

    if (summaryRes.data) setSummary(summaryRes.data)
    if (dailyRevenueRes.data) setDailyRevenue(dailyRevenueRes.data)
    if (monthlyRevenueRes.data) setMonthlyRevenue(monthlyRevenueRes.data)
    if (servicePopularityRes.data) setServicePopularity(servicePopularityRes.data)
    if (topCustomersRes.data) setTopCustomers(topCustomersRes.data)
    if (orderStatusRes.data) setOrderStatus(orderStatusRes.data)
    if (expensesByCategoryRes.data) setExpensesByCategory(expensesByCategoryRes.data)

    setLoading(false)
  }

  async function handleExportExcel() {
    if (!exportStartDate || !exportEndDate) {
      alert('⚠️ Harap pilih tanggal mulai dan tanggal akhir')
      return
    }

    if (new Date(exportStartDate) > new Date(exportEndDate)) {
      alert('⚠️ Tanggal mulai tidak boleh lebih besar dari tanggal akhir')
      return
    }

    try {
      setExportLoading(true)

      // Fetch detailed data (using summary format)
      const [transactionsRes, expensesRes] = await Promise.all([
        getTransactionSummary(exportStartDate, exportEndDate),
        getExpenseDetails(exportStartDate, exportEndDate)
      ])

      if (transactionsRes.error || expensesRes.error) {
        alert('❌ Gagal mengambil data')
        setExportLoading(false)
        return
      }

      const transactions = transactionsRes.data || []
      const expenses = expensesRes.data || []

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Sheet 1: Ringkasan Order (1 row per transaction)
      const transactionData = [
        ['RINGKASAN ORDER LAUNDRY'],
        ['Periode:', `${formatFullDate(exportStartDate)} s/d ${formatFullDate(exportEndDate)}`],
        [''],
        ['Tanggal', 'No Order', 'Nama Pelanggan', 'Total Berat (Kg)', 'Total Layanan', 'Total Transaksi', 'Dibayar', 'Sisa Pembayaran', 'Metode Bayar', 'Status', 'Tanggal Diambil'],
        ...transactions.map(t => {
          // Map order_status to readable format
          let statusText = t.status
          if (t.status === 'processing') statusText = 'Diproses'
          else if (t.status === 'done') statusText = 'Selesai'
          else if (t.status === 'taken') statusText = 'Diambil'
          
          return [
            formatFullDate(t.date),
            t.invoiceNumber,
            t.customerName,
            t.totalWeight,
            t.totalServices,
            t.totalAmount,
            t.paidAmount,
            t.remainingPayment,
            t.paymentMethod.toUpperCase(),
            statusText,
            t.pickupDate ? formatFullDate(t.pickupDate) : '-'
          ]
        })
      ]
      
      // Add summary row
      const totalRevenue = transactions.reduce((sum, t) => sum + t.paidAmount, 0)
      const totalWeight = transactions.reduce((sum, t) => sum + t.totalWeight, 0)
      const totalRemaining = transactions.reduce((sum, t) => sum + t.remainingPayment, 0)
      
      transactionData.push([
        '', 
        '', 
        'TOTAL', 
        totalWeight,
        '',
        '',
        totalRevenue,
        totalRemaining,
        '',
        '',
        ''
      ])

      const ws1 = XLSX.utils.aoa_to_sheet(transactionData)
      
      // Set column widths
      ws1['!cols'] = [
        { wch: 20 }, // Tanggal
        { wch: 15 }, // No Order
        { wch: 25 }, // Nama Pelanggan
        { wch: 15 }, // Total Berat
        { wch: 15 }, // Total Layanan
        { wch: 18 }, // Total Transaksi
        { wch: 18 }, // Dibayar
        { wch: 18 }, // Sisa Pembayaran
        { wch: 15 }, // Metode Bayar
        { wch: 12 }, // Status
        { wch: 20 }  // Tanggal Diambil
      ]
      
      XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan Order')

      // Sheet 2: Detail Pengeluaran
      const expenseData = [
        ['DETAIL PENGELUARAN'],
        ['Periode:', `${formatFullDate(exportStartDate)} s/d ${formatFullDate(exportEndDate)}`],
        [''],
        ['Tanggal', 'Kategori', 'Jumlah', 'Catatan'],
        ...expenses.map(e => [
          formatFullDate(e.date),
          e.category,
          e.amount,
          e.notes || '-'
        ])
      ]

      // Add summary row
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
      expenseData.push(['', '', 'TOTAL PENGELUARAN:', totalExpenses])

      const ws2 = XLSX.utils.aoa_to_sheet(expenseData)
      ws2['!cols'] = [
        { wch: 18 }, // Tanggal
        { wch: 20 }, // Kategori
        { wch: 15 }, // Jumlah
        { wch: 40 }  // Catatan
      ]
      XLSX.utils.book_append_sheet(wb, ws2, 'Detail Pengeluaran')

      // Sheet 3: Ringkasan
      const summaryData = [
        ['RINGKASAN LAPORAN'],
        ['Periode:', `${formatFullDate(exportStartDate)} s/d ${formatFullDate(exportEndDate)}`],
        [''],
        ['Keterangan', 'Jumlah'],
        ['Total Transaksi', transactions.length],
        ['Total Pendapatan', totalRevenue],
        [''],
        ['Total Pengeluaran', expenses.length],
        ['Total Biaya', totalExpenses],
        [''],
        ['PROFIT', totalRevenue - totalExpenses]
      ]
      const ws3 = XLSX.utils.aoa_to_sheet(summaryData)
      ws3['!cols'] = [
        { wch: 25 },
        { wch: 20 }
      ]
      XLSX.utils.book_append_sheet(wb, ws3, 'Ringkasan')

      // Generate file
      const fileName = `Laporan_Laundry_${exportStartDate}_to_${exportEndDate}.xlsx`
      XLSX.writeFile(wb, fileName)

      alert('✅ File Excel berhasil didownload')
      setShowExportDialog(false)
    } catch (error) {
      alert('❌ Gagal export Excel')
      console.error(error)
    } finally {
      setExportLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  }

  const openExportDialog = () => {
    // Set default dates (current month)
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setExportStartDate(firstDay.toISOString().split('T')[0])
    setExportEndDate(lastDay.toISOString().split('T')[0])
    setShowExportDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Laporan & Statistik</h2>
          <p className="text-sm md:text-base text-slate-600 mt-1">Analisis performa bisnis laundry</p>
        </div>
        
        <button
          onClick={openExportDialog}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium text-sm md:text-base"
        >
          <Download size={18} />
          Export Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Today Revenue */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg md:rounded-xl shadow-md p-3 md:p-5 text-white">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <DollarSign size={16} className="md:w-5 md:h-5" />
            <p className="text-xs md:text-sm text-emerald-100">Pendapatan Hari Ini</p>
          </div>
          <p className="text-lg md:text-2xl font-bold">{formatCurrency(summary?.todayRevenue || 0)}</p>
          <p className="text-xs md:text-sm text-emerald-100 mt-1">{summary?.todayTransactions || 0} transaksi</p>
        </div>

        {/* Today Expenses */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg md:rounded-xl shadow-md p-3 md:p-5 text-white">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <TrendingDown size={16} className="md:w-5 md:h-5" />
            <p className="text-xs md:text-sm text-red-100">Pengeluaran Hari Ini</p>
          </div>
          <p className="text-lg md:text-2xl font-bold">{formatCurrency(summary?.todayExpenses || 0)}</p>
        </div>

        {/* Month Revenue */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-md p-3 md:p-5 text-white">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <ShoppingCart size={16} className="md:w-5 md:h-5" />
            <p className="text-xs md:text-sm text-blue-100">Pendapatan Bulan Ini</p>
          </div>
          <p className="text-lg md:text-2xl font-bold">{formatCurrency(summary?.monthRevenue || 0)}</p>
          <p className="text-xs md:text-sm text-blue-100 mt-1">{summary?.monthTransactions || 0} transaksi</p>
        </div>

        {/* Month Profit */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl shadow-md p-3 md:p-5 text-white">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <TrendingUp size={16} className="md:w-5 md:h-5" />
            <p className="text-xs md:text-sm text-purple-100">Profit Bulan Ini</p>
          </div>
          <p className="text-lg md:text-2xl font-bold">{formatCurrency(summary?.monthProfit || 0)}</p>
          <p className="text-xs md:text-sm text-purple-100 mt-1">Revenue - Expenses</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">Pendapatan Harian (30 Hari Terakhir)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={formatDate}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Pendapatan"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">Pendapatan Bulanan (12 Bulan Terakhir)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={formatMonth}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Pendapatan" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Popularity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">Layanan Paling Populer</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={servicePopularity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="serviceName" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value: number) => `${value} kali`} />
              <Bar dataKey="count" fill="#10b981" name="Jumlah" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">Status Pesanan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={orderStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">Pengeluaran per Kategori</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">Pelanggan Teratas</h3>
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{customer.customerName}</p>
                    <p className="text-xs text-slate-500">{customer.transactions} transaksi</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(customer.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Dialog Modal */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Calendar className="text-emerald-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Export Laporan Excel</h3>
                <p className="text-sm text-slate-600">Pilih periode laporan yang ingin diexport</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Quick Month Selectors */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Cepat</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const now = new Date()
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
                      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                      setExportStartDate(firstDay.toISOString().split('T')[0])
                      setExportEndDate(lastDay.toISOString().split('T')[0])
                    }}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors"
                  >
                    Bulan Ini
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date()
                      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
                      setExportStartDate(firstDay.toISOString().split('T')[0])
                      setExportEndDate(lastDay.toISOString().split('T')[0])
                    }}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors"
                  >
                    Bulan Lalu
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Mulai</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Akhir</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Preview */}
              {exportStartDate && exportEndDate && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-emerald-800 mb-1">Preview Periode:</p>
                  <p className="text-sm text-emerald-700">
                    {new Date(exportStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' s/d '}
                    {new Date(exportEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportDialog(false)}
                disabled={exportLoading}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading || !exportStartDate || !exportEndDate}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
