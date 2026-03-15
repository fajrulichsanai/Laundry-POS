'use client'

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle size={20} className="text-green-600" />
        }
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: <AlertCircle size={20} className="text-red-600" />
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertTriangle size={20} className="text-yellow-600" />
        }
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: <Info size={20} className="text-blue-600" />
        }
    }
  }

  const styles = getStyles()

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in-right max-w-md">
      <div className={`${styles.bg} border rounded-lg shadow-lg p-4 flex items-start gap-3`}>
        <div className="flex-shrink-0 mt-0.5">
          {styles.icon}
        </div>
        <p className={`flex-1 ${styles.text} text-sm font-medium`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition`}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
