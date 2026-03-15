'use client'

import { useState } from 'react'
import { Printer, Send, X, CheckCircle } from 'lucide-react'
import type { ReceiptData } from '@/lib/utils/receipt'

interface PrintWhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  receiptData: ReceiptData
  onPrint: () => void
  onWhatsApp: () => void
}

export default function PrintWhatsAppModal({
  isOpen,
  onClose,
  receiptData,
  onPrint,
  onWhatsApp
}: PrintWhatsAppModalProps) {
  const [selectedAction, setSelectedAction] = useState<'print' | 'whatsapp' | null>(null)

  if (!isOpen) return null

  const handlePrint = () => {
    setSelectedAction('print')
    onPrint()
    setTimeout(() => {
      onClose()
      setSelectedAction(null)
    }, 500)
  }

  const handleWhatsApp = () => {
    setSelectedAction('whatsapp')
    onWhatsApp()
    setTimeout(() => {
      onClose()
      setSelectedAction(null)
    }, 500)
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Transaksi Berhasil!</h2>
                <p className="text-emerald-100 text-sm">Invoice: {receiptData.invoiceNumber}</p>
              </div>
            </div>
            <button 
              onClick={handleSkip}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Transaction Info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Customer:</span>
              <span className="font-semibold text-slate-900">{receiptData.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total:</span>
              <span className="font-bold text-emerald-600">
                Rp {receiptData.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Dibayar:</span>
              <span className="font-semibold text-slate-900">
                Rp {receiptData.paidAmount.toLocaleString('id-ID')}
              </span>
            </div>
            {receiptData.remaining > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-600">Sisa:</span>
                <span className="font-bold text-amber-600">
                  Rp {receiptData.remaining.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          <p className="text-center text-slate-600 text-sm">
            Pilih aksi yang ingin dilakukan:
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              disabled={selectedAction !== null}
              className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Printer size={28} className="text-slate-600 group-hover:text-emerald-600" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-slate-900 mb-1">Print Struk</div>
                <div className="text-xs text-slate-500">Cetak nota thermal</div>
              </div>
            </button>

            <button
              onClick={handleWhatsApp}
              disabled={selectedAction !== null}
              className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <Send size={28} className="text-slate-600 group-hover:text-green-600" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-slate-900 mb-1">Kirim WA</div>
                <div className="text-xs text-slate-500">Kirim ke pelanggan</div>
              </div>
            </button>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="w-full py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Lewati
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
