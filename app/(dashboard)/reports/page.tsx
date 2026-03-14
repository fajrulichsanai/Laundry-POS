'use client'

import { FileText, Download } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Laporan</h2>
        <p className="text-slate-600 mt-1">Generate dan export laporan keuangan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Laporan Harian', desc: 'Ringkasan transaksi dan keuangan harian' },
          { title: 'Laporan Bulanan', desc: 'Analisis performa bulanan lengkap' },
          { title: 'Laporan Pelanggan', desc: 'Data dan aktivitas pelanggan' },
          { title: 'Laporan Layanan', desc: 'Statistik layanan paling populer' },
          { title: 'Laporan Keuangan', desc: 'Pemasukan, pengeluaran, dan profit' },
          { title: 'Laporan Custom', desc: 'Buat laporan dengan filter custom' },
        ].map((report, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
            <FileText size={32} className="text-emerald-600 mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">{report.title}</h3>
            <p className="text-sm text-slate-600 mb-4">{report.desc}</p>
            <button className="w-full px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center justify-center gap-2 text-sm font-medium">
              <Download size={16} />
              Generate Laporan
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
