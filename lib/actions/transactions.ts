'use server'

import { createAuthClient } from '@/lib/supabase/auth-client'

export interface TransactionListItem {
  id: string
  invoice_number: string
  customer_id: string
  total_amount: number
  paid_amount: number
  payment_status: 'unpaid' | 'partial' | 'paid'
  order_status: 'processing' | 'done' | 'taken'
  payment_method: string | null
  notes: string | null
  created_at: string
  customer: {
    name: string
    phone: string
    address?: string
  } | null
}

export async function getTransactions(params?: {
  search?: string
  statusFilter?: string
}): Promise<{ data: TransactionListItem[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    let query = supabase
      .from('transactions')
      .select(`
        *,
        customer:customers(name, phone, address)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    // Apply search filter
    if (params?.search && params.search.trim() !== '') {
      // Note: This is a simple implementation. For better performance,
      // you should use Supabase full-text search or PostgreSQL text search
      const { data: allData } = await query
      
      const searchLower = params.search.toLowerCase()
      const filtered = allData?.filter(t => 
        t.invoice_number?.toLowerCase().includes(searchLower) ||
        t.customer?.name?.toLowerCase().includes(searchLower) ||
        t.customer?.phone?.includes(params.search || '')
      ) || []
      
      // Apply status filter if exists
      if (params?.statusFilter && params.statusFilter !== 'all') {
        const statusFiltered = filtered.filter(t => t.order_status === params.statusFilter)
        return { data: statusFiltered, error: null }
      }
      
      return { data: filtered, error: null }
    }

    // Apply status filter
    if (params?.statusFilter && params.statusFilter !== 'all') {
      query = query.eq('order_status', params.statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return { data: null, error: error.message }
    }

    return { data: data as TransactionListItem[], error: null }
  } catch (err: any) {
    console.error('Error in getTransactions:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}

export async function getTransactionDetail(transactionId: string) {
  try {
    const supabase = createAuthClient()
    
    // Load transaction with customer
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select(`
        *,
        customer:customers(name, phone, address)
      `)
      .eq('id', transactionId)
      .single()

    if (txError) {
      console.error('Error fetching transaction:', txError)
      return { data: null, error: txError.message }
    }

    // Load transaction items
    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select(`
        *,
        service:services(name)
      `)
      .eq('transaction_id', transactionId)

    if (itemsError) {
      console.error('Error fetching items:', itemsError)
      return { data: null, error: itemsError.message }
    }

    // Format items
    const formattedItems = items?.map(item => ({
      service_name: item.service?.name || 'Unknown',
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      subtotal: item.subtotal
    }))

    return {
      data: {
        ...transaction,
        items: formattedItems
      },
      error: null
    }
  } catch (err: any) {
    console.error('Error in getTransactionDetail:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}
