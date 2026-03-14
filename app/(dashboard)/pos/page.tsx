'use client'

import { ShoppingCart } from 'lucide-react'

export default function POSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Kasir (POS)</h2>
        <p className="text-slate-600 mt-1">Buat transaksi baru dan kelola pesanan</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
        <ShoppingCart size={64} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Point of Sale</h3>
        <p className="text-slate-600">Fitur POS akan segera tersedia</p>
      </div>
    </div>
  )
}
