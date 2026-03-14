'use server'

import { createAuthClient } from '@/lib/supabase/auth-client'
import { revalidatePath } from 'next/cache'

// Generate invoice number
function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV${year}${month}${day}${random}`
}

export interface CartItem {
  serviceId: string
  serviceName: string
  weight: number
  pricePerKg: number
  subtotal: number
}

export interface CreateTransactionInput {
  customerId: string
  userId: string
  items: CartItem[]
  totalAmount: number
  paidAmount: number
  paymentMethod: 'cash' | 'qris' | 'transfer' | 'saldo'
  notes?: string
}

export async function createTransaction(input: CreateTransactionInput) {
  const supabase = createAuthClient()

  try {
    // If payment method is saldo, validate and deduct balance
    if (input.paymentMethod === 'saldo') {
      // Get customer balance
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', input.customerId)
        .single()

      if (customerError) {
        return { error: 'Gagal mengambil data pelanggan: ' + customerError.message }
      }

      const currentBalance = Number(customer.balance) || 0
      if (input.paidAmount > currentBalance) {
        return { error: `Saldo tidak cukup! Saldo: Rp ${currentBalance.toLocaleString('id-ID')}` }
      }

      // Deduct balance
      const newBalance = currentBalance - input.paidAmount
      const { error: updateError } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', input.customerId)

      if (updateError) {
        return { error: 'Gagal mengurangi saldo: ' + updateError.message }
      }
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber()

    // Calculate payment status
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
    if (input.paidAmount >= input.totalAmount) {
      paymentStatus = 'paid'
    } else if (input.paidAmount > 0) {
      paymentStatus = 'partial'
    }

    // Get first service to estimate completion date
    const firstService = input.items[0]
    let estimationDays = 3 // default
    if (firstService) {
      const { data: service } = await supabase
        .from('services')
        .select('estimation_days')
        .eq('id', firstService.serviceId)
        .single()
      if (service) {
        estimationDays = service.estimation_days
      }
    }

    const estimatedCompletionDate = new Date()
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + estimationDays)

    // Insert transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: input.customerId,
        user_id: input.userId,
        total_amount: input.totalAmount,
        paid_amount: input.paidAmount,
        payment_status: paymentStatus,
        payment_method: input.paymentMethod,
        order_status: 'processing',
        notes: input.notes || null,
        estimated_completion_date: estimatedCompletionDate.toISOString(),
      })
      .select()
      .single()

    if (transactionError) {
      return { error: 'Gagal membuat transaksi: ' + transactionError.message }
    }

    // Insert transaction items
    const itemsToInsert = input.items.map(item => ({
      transaction_id: transaction.id,
      service_id: item.serviceId,
      service_name: item.serviceName,
      quantity: item.weight,
      price_at_time: item.pricePerKg,
      subtotal: item.subtotal,
    }))

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsToInsert)

    if (itemsError) {
      // Rollback transaction
      await supabase.from('transactions').delete().eq('id', transaction.id)
      return { error: 'Gagal menyimpan item transaksi: ' + itemsError.message }
    }

    revalidatePath('/pos')
    revalidatePath('/transactions')

    return { 
      success: true, 
      transaction,
      invoiceNumber 
    }
  } catch (error: any) {
    return { error: 'Terjadi kesalahan: ' + error.message }
  }
}

export async function getCustomers(search?: string) {
  const supabase = createAuthClient()

  let query = supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true })

  if (search && search.length > 0) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data || [] }
}

export async function createCustomer(data: { name: string; phone: string; email?: string; address?: string }) {
  const supabase = createAuthClient()

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
    })
    .select()
    .single()

  if (error) {
    return { error: 'Gagal membuat customer: ' + error.message }
  }

  revalidatePath('/pos')
  revalidatePath('/customers')

  return { success: true, customer }
}

export async function getServices() {
  const supabase = createAuthClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .eq('price_type', 'kg')
    .order('name', { ascending: true })

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data || [] }
}
