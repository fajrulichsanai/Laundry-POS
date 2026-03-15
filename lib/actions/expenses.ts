'use server'

import { createAuthClient } from '@/lib/supabase/auth-client'
import { revalidatePath } from 'next/cache'

export interface ExpenseListItem {
  id: string
  category: string
  description: string
  amount: number
  date: string
  notes?: string | null
  created_at: string
}

export interface ExpenseSummary {
  todayTotal: number
  monthTotal: number
  todayCount: number
  monthCount: number
}

export interface CreateExpenseInput {
  category: string
  description: string
  amount: number
  date: string
  notes?: string
}

export interface UpdateExpenseInput {
  id: string
  category: string
  description: string
  amount: number
  date: string
  notes?: string
}

// Get expenses with optional filters
export async function getExpenses(params?: {
  search?: string
  categoryFilter?: string
  startDate?: string
  endDate?: string
}): Promise<{ data: ExpenseListItem[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)

    // Apply date range filter
    if (params?.startDate) {
      query = query.gte('date', params.startDate)
    }
    if (params?.endDate) {
      query = query.lte('date', params.endDate)
    }

    // Apply category filter
    if (params?.categoryFilter && params.categoryFilter !== 'all') {
      query = query.eq('category', params.categoryFilter)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: error.message }
    }

    // Apply search filter (client-side for simplicity)
    let filteredData = data || []
    if (params?.search && params.search.trim() !== '') {
      const searchLower = params.search.toLowerCase()
      filteredData = filteredData.filter(expense =>
        expense.description?.toLowerCase().includes(searchLower) ||
        expense.category?.toLowerCase().includes(searchLower) ||
        expense.notes?.toLowerCase().includes(searchLower)
      )
    }

    return { data: filteredData, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Get expense summary (today and month totals)
export async function getExpenseSummary(): Promise<{ data: ExpenseSummary | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    // Get current date info
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get today's expenses
    const { data: todayData, error: todayError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('date', today)

    if (todayError) {
      return { data: null, error: todayError.message }
    }

    // Get this month's expenses
    const { data: monthData, error: monthError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', monthStart)
      .lte('date', monthEnd)

    if (monthError) {
      return { data: null, error: monthError.message }
    }

    // Calculate totals
    const todayTotal = todayData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
    const monthTotal = monthData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

    return {
      data: {
        todayTotal,
        monthTotal,
        todayCount: todayData?.length || 0,
        monthCount: monthData?.length || 0
      },
      error: null
    }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Create new expense
export async function createExpense(input: CreateExpenseInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAuthClient()

    // Validate input
    if (!input.category || !input.description || !input.amount || !input.date) {
      return { success: false, error: 'Semua field wajib diisi' }
    }

    if (input.amount <= 0) {
      return { success: false, error: 'Jumlah harus lebih dari 0' }
    }

    const { error } = await supabase
      .from('expenses')
      .insert({
        category: input.category,
        description: input.description,
        amount: input.amount,
        date: input.date,
        notes: input.notes || null
      })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/expenses')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update existing expense
export async function updateExpense(input: UpdateExpenseInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAuthClient()

    // Validate input
    if (!input.id || !input.category || !input.description || !input.amount || !input.date) {
      return { success: false, error: 'Semua field wajib diisi' }
    }

    if (input.amount <= 0) {
      return { success: false, error: 'Jumlah harus lebih dari 0' }
    }

    const { error } = await supabase
      .from('expenses')
      .update({
        category: input.category,
        description: input.description,
        amount: input.amount,
        date: input.date,
        notes: input.notes || null
      })
      .eq('id', input.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/expenses')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Delete expense
export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAuthClient()

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/expenses')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
