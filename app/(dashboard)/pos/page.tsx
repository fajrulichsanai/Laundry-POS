'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, ShoppingCart, Trash2, DollarSign, Check, Printer, Send, X } from 'lucide-react'
import { getCustomers, createCustomer, getServices, createTransaction, type CartItem } from '@/lib/actions/pos'
import { getCurrentUser } from '@/lib/actions/auth'
import WeightInput from '@/components/pos/WeightInput'
import { printReceipt, sendWhatsApp, type ReceiptData } from '@/lib/utils/receipt'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  balance?: number
}

interface Service {
  id: string
  name: string
  description?: string
  price: number
  estimation_days: number
}

type Step = 'customer' | 'service' | 'cart' | 'payment'

export default function POSPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [showWeightInput, setShowWeightInput] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [tempWeight, setTempWeight] = useState(1)
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<Step>('customer')

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })

  // Payment form
  const [payment, setPayment] = useState({
    paidAmount: 0,
    paymentMethod: 'cash' as 'cash' | 'qris' | 'transfer' | 'saldo',
    notes: ''
  })

  // Load data
  useEffect(() => {
    loadServices()
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (searchTerm.length > 0) {
      searchCustomers(searchTerm)
    } else {
      setCustomers([])
    }
  }, [searchTerm])

  async function loadCurrentUser() {
    const user = await getCurrentUser()
    setCurrentUser(user)
  }

  async function loadServices() {
    const result = await getServices()
    if (result.data) {
      setServices(result.data)
    }
  }

  async function searchCustomers(search: string) {
    const result = await getCustomers(search)
    if (result.data) {
      setCustomers(result.data)
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await createCustomer(newCustomer)

    if (result.error) {
      alert(result.error)
    } else if (result.customer) {
      setSelectedCustomer(result.customer)
      setShowNewCustomer(false)
      setNewCustomer({ name: '', phone: '', email: '', address: '' })
      setCurrentStep('service')
    }

    setLoading(false)
  }

  function handleSelectService(service: Service) {
    setSelectedService(service)
    setTempWeight(1)
    setShowWeightInput(true)
  }

  function handleWeightConfirm() {
    if (!selectedService || tempWeight <= 0) return

    const subtotal = tempWeight * selectedService.price

    const newItem: CartItem = {
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      weight: tempWeight,
      pricePerKg: selectedService.price,
      subtotal
    }

    setCart([...cart, newItem])
    setShowWeightInput(false)
    setSelectedService(null)
    setTempWeight(1)
  }

  function removeFromCart(index: number) {
    setCart(cart.filter((_, i) => i !== index))
  }

  function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }

  function calculateRemaining() {
    return Math.max(0, calculateTotal() - payment.paidAmount)
  }

  async function handleCheckout() {
    if (!selectedCustomer) {
      alert('Pilih customer terlebih dahulu')
      return
    }

    if (cart.length === 0) {
      alert('Keranjang masih kosong')
      return
    }

    if (!currentUser) {
      alert('User tidak ditemukan')
      return
    }

    // Validate saldo payment
    if (payment.paymentMethod === 'saldo') {
      const customerBalance = selectedCustomer.balance || 0
      if (payment.paidAmount > customerBalance) {
        alert(`Saldo tidak cukup! Saldo: Rp ${customerBalance.toLocaleString('id-ID')}`)
        return
      }
    }

    setLoading(true)

    const result = await createTransaction({
      customerId: selectedCustomer.id,
      userId: currentUser.id,
      items: cart,
      totalAmount: calculateTotal(),
      paidAmount: payment.paidAmount,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes
    })

    if (result.error) {
      alert(result.error)
      setLoading(false)
    } else if (result.transaction) {
      // Success - show print and WhatsApp options
      const estimatedDate = new Date()
      estimatedDate.setDate(estimatedDate.getDate() + 3)

      const receiptData: ReceiptData = {
        invoiceNumber: result.invoiceNumber!,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items: cart,
        totalAmount: calculateTotal(),
        paidAmount: payment.paidAmount,
        remaining: calculateRemaining(),
        paymentMethod: payment.paymentMethod,
        createdAt: new Date(),
        estimatedCompletion: estimatedDate
      }

      // Show success modal with options
      showSuccessModal(receiptData)
    }
  }

  function showSuccessModal(receiptData: ReceiptData) {
    const print = confirm(
      `✅ Transaksi Berhasil!\n\nInvoice: ${receiptData.invoiceNumber}\n\nKlik OK untuk print struk, atau Cancel untuk lewati.`
    )

    if (print) {
      printReceipt(receiptData)
    }

    setTimeout(() => {
      const sendWA = confirm(`Kirim nota ke WhatsApp pelanggan?\n\n${receiptData.customerName}\n${receiptData.customerPhone}`)
      if (sendWA) {
        sendWhatsApp(receiptData)
      }

      // Reset form
      resetForm()
    }, 300)
  }

  function resetForm() {
    setCart([])
    setSelectedCustomer(null)
    setPayment({ paidAmount: 0, paymentMethod: 'cash', notes: '' })
    setShowPayment(false)
    setSearchTerm('')
    setCurrentStep('customer')
    setLoading(false)
  }

  const total = calculateTotal()
  const remaining = calculateRemaining()
  const paymentStatus = payment.paidAmount >= total ? 'Lunas' : payment.paidAmount > 0 ? 'DP' : 'Belum Bayar'

  return (
    <>
      <div className="pb-32 md:pb-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Kasir (POS)</h2>
          <p className="text-sm md:text-base text-slate-600 mt-1">Buat transaksi baru</p>
        </div>

        {/* Progress Steps - Mobile */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm md:hidden">
          <div className="flex items-center justify-between">
            <div className={`flex-1 text-center ${currentStep === 'customer' ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <div className="text-xs">1. Customer</div>
            </div>
            <div className="w-8 h-0.5 bg-slate-200"></div>
            <div className={`flex-1 text-center ${currentStep === 'service' ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <div className="text-xs">2. Layanan</div>
            </div>
            <div className="w-8 h-0.5 bg-slate-200"></div>
            <div className={`flex-1 text-center ${currentStep === 'cart' ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <div className="text-xs">3. Keranjang</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base md:text-lg">1. Pilih Pelanggan</h3>
              {selectedCustomer && (
                <button
                  onClick={() => {
                    setSelectedCustomer(null)
                    setCurrentStep('customer')
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Ganti
                </button>
              )}
            </div>

            {!selectedCustomer ? (
              <>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari nama atau HP..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowNewCustomer(true)}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1 text-sm"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Baru</span>
                  </button>
                </div>

                {customers.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setCurrentStep('service')
                        }}
                        className="p-3 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition"
                      >
                        <div className="font-medium text-sm">{customer.name}</div>
                        <div className="text-xs text-slate-600">{customer.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="font-semibold">{selectedCustomer.name}</div>
                <div className="text-sm text-slate-600">{selectedCustomer.phone}</div>
              </div>
            )}
          </div>

          {/* Services - Compact Grid */}
          {selectedCustomer && (
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-100">
              <h3 className="font-semibold text-base md:text-lg mb-3">2. Pilih Layanan</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                {services.map(service => (
                  <div
                    key={service.id}
                    onClick={() => handleSelectService(service)}
                    className="p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition active:scale-95"
                  >
                    <div className="font-medium text-sm">{service.name}</div>
                    <div className="text-emerald-600 font-bold text-sm mt-1">
                      {service.price.toLocaleString('id-ID')}/kg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Cart */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <h3 className="font-semibold text-lg mb-4">Keranjang</h3>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                <p>Keranjang kosong</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cart.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.serviceName}</div>
                        <div className="text-xs text-slate-600">
                          {item.weight} kg × Rp {item.pricePerKg.toLocaleString('id-ID')} = Rp {item.subtotal.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                  </div>

                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full mt-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold flex items-center justify-center gap-2"
                  >
                    <DollarSign size={20} />
                    Bayar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar - Mobile Only */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-emerald-500 shadow-2xl z-40">
          <div className="p-4">
            {/* Mini Cart Summary */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-slate-600">{cart.length} item</div>
                <div className="font-bold text-lg">Rp {total.toLocaleString('id-ID')}</div>
              </div>
              <button
                onClick={() => setCurrentStep('cart')}
                className="text-emerald-600 text-sm font-medium hover:underline"
              >
                Lihat Detail →
              </button>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowPayment(true)}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <DollarSign size={20} />
              Proses Pembayaran
            </button>
          </div>
        </div>
      )}

      {/* Modal: Cart Detail - Mobile Only */}
      {currentStep === 'cart' && (
        <div className="md:hidden fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Detail Pesanan</h3>
              <button
                onClick={() => setCurrentStep('service')}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                <p>Keranjang kosong</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-base">{item.serviceName}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            {item.weight} kg × Rp {item.pricePerKg.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCurrentStep('service')
                    setShowPayment(true)
                  }}
                  className="w-full px-4 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <DollarSign size={20} />
                  Lanjut Pembayaran
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Weight Input Modal */}
      {showWeightInput && selectedService && (
        <WeightInput
          value={tempWeight}
          onChange={setTempWeight}
          onConfirm={handleWeightConfirm}
          onCancel={() => {
            setShowWeightInput(false)
            setSelectedService(null)
          }}
        />
      )}

      {/* Modal: New Customer */}
      {showNewCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Tambah Pelanggan Baru</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama *</label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">No. HP *</label>
                <input
                  type="tel"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="08123456789"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payment */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl md:rounded-xl p-6 w-full md:max-w-md md:w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Pembayaran</h3>
              <button
                onClick={() => setShowPayment(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Total</span>
                  <span className="font-bold text-lg">Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Jumlah Dibayar</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="1000"
                  min="0"
                  value={payment.paidAmount || ''}
                  onChange={(e) => setPayment({...payment, paidAmount: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPayment({...payment, paidAmount: total})}
                    className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium"
                  >
                    Lunas
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayment({...payment, paidAmount: Math.round(total * 0.5)})}
                    className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium"
                  >
                    50% DP
                  </button>
                  {payment.paymentMethod === 'saldo' && selectedCustomer?.balance && selectedCustomer.balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayment({...payment, paidAmount: Math.min(total, selectedCustomer.balance || 0)})}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                    >
                      Gunakan Saldo
                    </button>
                  )}
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-orange-600 font-semibold">
                    Sisa: Rp {remaining.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cash', 'qris', 'transfer', 'saldo'] as const).map(method => {
                    const customerBalance = selectedCustomer?.balance || 0
                    const isSaldo = method === 'saldo'
                    const balanceInsufficient = isSaldo && payment.paidAmount > customerBalance
                    
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPayment({...payment, paymentMethod: method})}
                        disabled={isSaldo && customerBalance === 0}
                        className={`px-4 py-2.5 rounded-lg border-2 transition font-medium ${
                          payment.paymentMethod === method
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 hover:border-slate-300'
                        } ${isSaldo && customerBalance === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {method === 'cash' ? 'Tunai' : 
                         method === 'qris' ? 'QRIS' :
                         method === 'transfer' ? 'Transfer' : 
                         isSaldo ? (
                           <div className="text-xs">
                             <div>Saldo</div>
                             <div className={balanceInsufficient ? 'text-red-600' : ''}>
                               Rp {customerBalance.toLocaleString('id-ID')}
                             </div>
                           </div>
                         ) : method}
                      </button>
                    )
                  })}
                </div>
                {payment.paymentMethod === 'saldo' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-700">
                      💡 Pembayaran akan langsung mengurangi saldo pelanggan
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayment(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                >
                  <Check size={20} />
                  {loading ? 'Proses...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

