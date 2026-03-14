'use server'

import { createAuthClient } from '@/lib/supabase/auth-client'
import { revalidatePath } from 'next/cache'

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  balance: number
  created_at: string
}

export async function getCustomers(search?: string): Promise<{ data: Customer[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching customers:', error)
      return { data: null, error: error.message }
    }

    // Filter by search on server side if needed
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase()
      const filtered = data?.filter(c => 
        c.name?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(search)
      ) || []
      return { data: filtered, error: null }
    }

    return { data: data as Customer[], error: null }
  } catch (err: any) {
    console.error('Error in getCustomers:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}

export async function createCustomer(customerData: {
  name: string
  phone: string
  email?: string
  address?: string
}): Promise<{ data: Customer | null; error: string | null }> {
  try {
    const supabase = createAuthClient()

    const { data, error } = await supabase
      .from('customers')
      .insert([{
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || null,
        address: customerData.address || null,
        balance: 0
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/customers')
    return { data: data as Customer, error: null }
  } catch (err: any) {
    console.error('Error in createCustomer:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}

export async function updateCustomer(
  customerId: string,
  customerData: {
    name?: string
    phone?: string
    email?: string
    address?: string
  }
): Promise<{ data: Customer | null; error: string | null }> {
  try {
    const supabase = createAuthClient()

    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', customerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/customers')
    return { data: data as Customer, error: null }
  } catch (err: any) {
    console.error('Error in updateCustomer:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}

export async function topUpBalance(
  customerId: string,
  amount: number
): Promise<{ data: Customer | null; error: string | null }> {
  try {
    if (amount <= 0) {
      return { data: null, error: 'Jumlah top-up harus lebih dari 0' }
    }

    const supabase = createAuthClient()

    // Get current balance
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('balance')
      .eq('id', customerId)
      .single()

    if (fetchError) {
      console.error('Error fetching customer:', fetchError)
      return { data: null, error: fetchError.message }
    }

    const newBalance = Number(customer.balance) + amount

    // Update balance
    const { data, error } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', customerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating balance:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/customers')
    return { data: data as Customer, error: null }
  } catch (err: any) {
    console.error('Error in topUpBalance:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}

export async function getCustomerTransactions(customerId: string) {
  try {
    const supabase = createAuthClient()

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching transactions:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err: any) {
    console.error('Error in getCustomerTransactions:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}
