'use server'

import { createAuthClient } from '@/lib/supabase/auth-client'
import { revalidatePath } from 'next/cache'

export interface Service {
  id: string
  name: string
  description?: string | null
  price: number
  price_type: string
  estimation_days: number
  active: boolean
  created_at: string
}

export async function getServices(): Promise<{ data: Service[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching services:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Service[], error: null }
  } catch (err: any) {
    console.error('Error in getServices:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}

export async function createService(serviceData: {
  name: string
  description?: string
  price: number
  price_type: string
  estimation_days: number
}): Promise<{ data: Service | null; error: string | null }> {
  try {
    const supabase = createAuthClient()

    const { data, error } = await supabase
      .from('services')
      .insert([{
        name: serviceData.name,
        description: serviceData.description || null,
        price: serviceData.price,
        price_type: serviceData.price_type,
        estimation_days: serviceData.estimation_days,
        active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/services')
    return { data: data as Service, error: null }
  } catch (err: any) {
    console.error('Error in createService:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}

export async function updateService(
  serviceId: string,
  serviceData: {
    name?: string
    description?: string
    price?: number
    price_type?: string
    estimation_days?: number
    active?: boolean
  }
): Promise<{ data: Service | null; error: string | null }> {
  try {
    const supabase = createAuthClient()

    const { data, error } = await supabase
      .from('services')
      .update(serviceData)
      .eq('id', serviceId)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/services')
    return { data: data as Service, error: null }
  } catch (err: any) {
    console.error('Error in updateService:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}

export async function deleteService(serviceId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createAuthClient()

    // Check if service is used in transactions
    const { data: usedInTransactions } = await supabase
      .from('transaction_items')
      .select('id')
      .eq('service_id', serviceId)
      .limit(1)

    if (usedInTransactions && usedInTransactions.length > 0) {
      return { success: false, error: 'Layanan tidak dapat dihapus karena sudah digunakan dalam transaksi' }
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)

    if (error) {
      console.error('Error deleting service:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/services')
    return { success: true, error: null }
  } catch (err: any) {
    console.error('Error in deleteService:', err)
    return { success: false, error: err.message || 'Terjadi kesalahan' }
  }
}
