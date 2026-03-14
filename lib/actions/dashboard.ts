'use server'

import { createAuthClient } from '@/lib/supabase/auth-client'

export interface DashboardStats {
  laundryMasuk: number
  laundryDiproses: number
  laundrySelesai: number
  belumDiambil: number
  pendapatanHariIni: number
}

export async function getDashboardStats(): Promise<{ data: DashboardStats | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    const today = new Date().toISOString().split('T')[0]

    // Fetch all transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')

    if (txError) {
      console.error('Error fetching transactions:', txError)
      return { data: null, error: txError.message }
    }

    // Count by status
    const todayTx = transactions?.filter(t => t.created_at?.startsWith(today)) || []
    
    const laundryMasuk = todayTx.length
    const laundryDiproses = transactions?.filter(t => t.order_status === 'processing').length || 0
    const laundrySelesai = transactions?.filter(t => t.order_status === 'done').length || 0
    const belumDiambil = transactions?.filter(t => t.order_status === 'done').length || 0
    
    const pendapatanHariIni = todayTx.reduce((sum, t) => {
      return sum + (Number(t.paid_amount) || 0)
    }, 0)

    return {
      data: {
        laundryMasuk,
        laundryDiproses,
        laundrySelesai,
        belumDiambil,
        pendapatanHariIni
      },
      error: null
    }
  } catch (err: any) {
    console.error('Error in getDashboardStats:', err)
    return { data: null, error: err.message || 'Terjadi kesalahan' }
  }
}
