'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

interface WeightInputProps {
  value: number
  onChange: (value: number) => void
  onConfirm: () => void
  onCancel: () => void
}

export default function WeightInput({ value, onChange, onConfirm, onCancel }: WeightInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())

  const handleIncrement = (amount: number) => {
    const newValue = Math.max(0, value + amount)
    const rounded = Math.round(newValue * 10) / 10 // round to 1 decimal
    onChange(rounded)
    setInputValue(rounded.toString())
  }

  const handleInputChange = (val: string) => {
    setInputValue(val)
    const parsed = parseFloat(val)
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed)
    }
  }

  const handleInputBlur = () => {
    const parsed = parseFloat(inputValue)
    if (isNaN(parsed) || parsed < 0) {
      setInputValue('0')
      onChange(0)
    } else {
      const rounded = Math.round(parsed * 10) / 10
      setInputValue(rounded.toString())
      onChange(rounded)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold mb-4 text-center">Input Berat Cucian</h3>
        
        {/* Custom number input with +/- buttons */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {/* Minus button */}
            <button
              type="button"
              onClick={() => handleIncrement(-0.5)}
              className="w-14 h-14 rounded-xl bg-slate-200 hover:bg-slate-300 active:bg-slate-400 flex items-center justify-center transition"
            >
              <Minus size={24} className="text-slate-700" />
            </button>

            {/* Input field */}
            <div className="flex-1">
              <input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                className="w-full text-center text-4xl font-bold py-4 px-3 border-2 border-emerald-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-200"
                placeholder="0"
              />
              <div className="text-center text-sm text-slate-500 mt-2">
                kilogram (kg)
              </div>
            </div>

            {/* Plus button */}
            <button
              type="button"
              onClick={() => handleIncrement(0.5)}
              className="w-14 h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 flex items-center justify-center transition"
            >
              <Plus size={24} className="text-white" />
            </button>
          </div>

          {/* Quick select buttons */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[0.5, 1, 2, 3].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  onChange(amount)
                  setInputValue(amount.toString())
                }}
                className="py-2 px-3 bg-slate-100 hover:bg-emerald-100 rounded-lg text-sm font-medium transition"
              >
                {amount} kg
              </button>
            ))}
          </div>

          {/* Increment buttons */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleIncrement(-1)}
              className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition"
            >
              -1 kg
            </button>
            <button
              type="button"
              onClick={() => handleIncrement(-0.5)}
              className="py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition"
            >
              -0.5 kg
            </button>
            <button
              type="button"
              onClick={() => handleIncrement(0.5)}
              className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium transition"
            >
              +0.5 kg
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-semibold transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={value <= 0}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
