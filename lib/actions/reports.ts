'use server'

import { createAuthClient } from '@/lib/supabase/auth-client'

export interface ReportSummary {
  todayTransactions: number
  todayRevenue: number
  todayExpenses: number
  todayProfit: number
  monthTransactions: number
  monthRevenue: number
  monthExpenses: number
  monthProfit: number
}

export interface DailyRevenue {
  date: string
  revenue: number
  transactions: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  transactions: number
}

export interface ServicePopularity {
  serviceName: string
  count: number
  revenue: number
}

export interface TopCustomer {
  customerName: string
  transactions: number
  totalSpent: number
}

export interface OrderStatus {
  status: string
  count: number
}

export interface ExpenseByCategory {
  category: string
  total: number
}

export interface TransactionDetail {
  id: string
  date: string
  customerName: string
  serviceName: string
  weight: number
  pricePerKg: number
  subtotal: number
  totalAmount: number
  paidAmount: number
  paymentMethod: string
  status: string
}

export interface TransactionSummary {
  id: string
  date: string
  invoiceNumber: string
  customerName: string
  totalWeight: number
  totalServices: number
  totalAmount: number
  paidAmount: number
  remainingPayment: number
  paymentMethod: string
  status: string
  pickupDate: string | null
}

export interface ExpenseDetail {
  id: string
  date: string
  category: string
  amount: number
  notes: string | null
}

// Get summary statistics
export async function getReportSummary(startDate?: string, endDate?: string): Promise<{ data: ReportSummary | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    // Get current date info
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get today's transactions
    const { data: todayTrans, error: todayTransError } = await supabase
      .from('transactions')
      .select('paid_amount')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (todayTransError) {
      return { data: null, error: todayTransError.message }
    }

    // Get today's expenses
    const { data: todayExp, error: todayExpError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('date', today)

    if (todayExpError) {
      return { data: null, error: todayExpError.message }
    }

    // Get this month's transactions
    const { data: monthTrans, error: monthTransError } = await supabase
      .from('transactions')
      .select('paid_amount')
      .gte('created_at', `${monthStart}T00:00:00`)
      .lte('created_at', `${monthEnd}T23:59:59`)

    if (monthTransError) {
      return { data: null, error: monthTransError.message }
    }

    // Get this month's expenses
    const { data: monthExp, error: monthExpError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', monthStart)
      .lte('date', monthEnd)

    if (monthExpError) {
      return { data: null, error: monthExpError.message }
    }

    // Calculate totals
    const todayRevenue = todayTrans?.reduce((sum, t) => sum + Number(t.paid_amount), 0) || 0
    const todayExpenses = todayExp?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
    const monthRevenue = monthTrans?.reduce((sum, t) => sum + Number(t.paid_amount), 0) || 0
    const monthExpenses = monthExp?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

    return {
      data: {
        todayTransactions: todayTrans?.length || 0,
        todayRevenue,
        todayExpenses,
        todayProfit: todayRevenue - todayExpenses,
        monthTransactions: monthTrans?.length || 0,
        monthRevenue,
        monthExpenses,
        monthProfit: monthRevenue - monthExpenses
      },
      error: null
    }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Get daily revenue (last 30 days)
export async function getDailyRevenue(days: number = 30): Promise<{ data: DailyRevenue[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('transactions')
      .select('created_at, paid_amount')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    // Group by date
    const grouped = data.reduce((acc: Record<string, { revenue: number; transactions: number }>, item) => {
      const date = item.created_at.split('T')[0]
      if (!acc[date]) {
        acc[date] = { revenue: 0, transactions: 0 }
      }
      acc[date].revenue += Number(item.paid_amount)
      acc[date].transactions += 1
      return acc
    }, {})

    const result: DailyRevenue[] = Object.entries(grouped).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactions: data.transactions
    }))

    return { data: result, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Get monthly revenue (last 12 months)
export async function getMonthlyRevenue(): Promise<{ data: MonthlyRevenue[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 12)

    const { data, error } = await supabase
      .from('transactions')
      .select('created_at, paid_amount')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    // Group by month
    const grouped = data.reduce((acc: Record<string, { revenue: number; transactions: number }>, item) => {
      const date = new Date(item.created_at)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[month]) {
        acc[month] = { revenue: 0, transactions: 0 }
      }
      acc[month].revenue += Number(item.paid_amount)
      acc[month].transactions += 1
      return acc
    }, {})

    const result: MonthlyRevenue[] = Object.entries(grouped).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      transactions: data.transactions
    }))

    return { data: result, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Get service popularity
export async function getServicePopularity(limit: number = 10): Promise<{ data: ServicePopularity[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    const { data, error } = await supabase
      .from('transaction_items')
      .select('service_name, quantity, subtotal')

    if (error) {
      return { data: null, error: error.message }
    }

    // Group by service
    const grouped = data.reduce((acc: Record<string, { count: number; revenue: number }>, item) => {
      const serviceName = item.service_name
      if (!acc[serviceName]) {
        acc[serviceName] = { count: 0, revenue: 0 }
      }
      acc[serviceName].count += 1
      acc[serviceName].revenue += Number(item.subtotal)
      return acc
    }, {})

    const result: ServicePopularity[] = Object.entries(grouped)
      .map(([serviceName, data]) => ({
        serviceName,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return { data: result, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Get top customers
export async function getTopCustomers(limit: number = 10): Promise<{ data: TopCustomer[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    const { data, error } = await supabase
      .from('transactions')
      .select('customer_id, paid_amount, customer:customers(name)')

    if (error) {
      return { data: null, error: error.message }
    }

    // Group by customer
    const grouped = data.reduce((acc: Record<string, { customerName: string; transactions: number; totalSpent: number }>, item) => {
      const customerId = item.customer_id
      if (!acc[customerId]) {
        acc[customerId] = {
          customerName: (item.customer as any)?.name || 'Unknown',
          transactions: 0,
          totalSpent: 0
        }
      }
      acc[customerId].transactions += 1
      acc[customerId].totalSpent += Number(item.paid_amount)
      return acc
    }, {})

    const result: TopCustomer[] = Object.values(grouped)
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, limit)

    return { data: result, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Get order status summary
export async function getOrderStatus(): Promise<{ data: OrderStatus[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    const { data, error } = await supabase
      .from('transactions')
      .select('order_status')

    if (error) {
      return { data: null, error: error.message }
    }

    // Group by status
    const grouped = data.reduce((acc: Record<string, number>, item) => {
      const status = item.order_status
      if (!acc[status]) {
        acc[status] = 0
      }
      acc[status] += 1
      return acc
    }, {})

    const result: OrderStatus[] = Object.entries(grouped).map(([status, count]) => ({
      status,
      count
    }))

    return { data: result, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Get expenses by category
export async function getExpensesByCategory(): Promise<{ data: ExpenseByCategory[] | null; error: string | null }> {
  try {
    const supabase = createAuthClient()
    
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')

    if (error) {
      return { data: null, error: error.message }
    }

    // Group by category
    const grouped = data.reduce((acc: Record<string, number>, item) => {
      const category = item.category
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += Number(item.amount)
      return acc
    }, {})

    const result: ExpenseByCategory[] = Object.entries(grouped)
      .map(([category, total]) => ({
        category,
        total
      }))
      .sort((a, b) => b.total - a.total)

    return { data: result, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Get detailed transactions with date range filter
export async function getTransactionDetails(startDate: string, endDate: string) {
  try {
    const supabase = createAuthClient()
    
    // Add one day to endDate to include the full end day
    const endDatePlusOne = new Date(endDate)
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1)
    
    // Get transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select(`
        id,
        created_at,
        total_amount,
        paid_amount,
        payment_method,
        order_status,
        customer:customers(name)
      `)
      .gte('created_at', startDate)
      .lt('created_at', endDatePlusOne.toISOString())
      .order('created_at', { ascending: true })

    if (txError) {
      console.error('Transaction error:', txError)
      return { data: null, error: txError.message }
    }

    if (!transactions || transactions.length === 0) {
      return { data: [], error: null }
    }

    // Get all transaction IDs
    const transactionIds = transactions.map(t => t.id)

    // Get transaction items for these transactions
    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select(`
        transaction_id,
        quantity,
        price_at_time,
        subtotal,
        service:services(name)
      `)
      .in('transaction_id', transactionIds)

    if (itemsError) {
      console.error('Items error:', itemsError)
      return { data: null, error: itemsError.message }
    }

    // Transform data to flat structure
    const details: TransactionDetail[] = []
    
    transactions.forEach((trans: any) => {
      // Find items for this transaction
      const transItems = items?.filter((item: any) => item.transaction_id === trans.id) || []
      
      if (transItems.length === 0) {
        // Transaction without items (shouldn't happen, but handle it)
        details.push({
          id: trans.id,
          date: trans.created_at,
          customerName: trans.customer?.name || 'Unknown',
          serviceName: 'No Service',
          weight: 0,
          pricePerKg: 0,
          subtotal: 0,
          totalAmount: trans.total_amount,
          paidAmount: trans.paid_amount,
          paymentMethod: trans.payment_method,
          status: trans.order_status
        })
      } else {
        // Add one row per item
        transItems.forEach((item: any) => {
          details.push({
            id: trans.id,
            date: trans.created_at,
            customerName: trans.customer?.name || 'Unknown',
            serviceName: item.service?.name || 'Unknown Service',
            weight: item.quantity || 0,
            pricePerKg: item.price_at_time || 0,
            subtotal: item.subtotal || 0,
            totalAmount: trans.total_amount,
            paidAmount: trans.paid_amount,
            paymentMethod: trans.payment_method,
            status: trans.order_status
          })
        })
      }
    })

    return { data: details, error: null }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return { data: null, error: error.message }
  }
}

// Get detailed expenses with date range filter
export async function getExpenseDetails(startDate: string, endDate: string) {
  try {
    const supabase = createAuthClient()
    
    // Add one day to endDate to include the full end day
    const endDatePlusOne = new Date(endDate)
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1)
    
    const { data, error } = await supabase
      .from('expenses')
      .select('id, date, category, amount, notes')
      .gte('date', startDate)
      .lt('date', endDatePlusOne.toISOString())
      .order('date', { ascending: true })

    if (error) {
      console.error('Expense error:', error)
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: [], error: null }
    }

    const details: ExpenseDetail[] = data.map((expense: any) => ({
      id: expense.id,
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      notes: expense.notes || null
    }))

    return { data: details, error: null }
  } catch (error: any) {
    console.error('Unexpected error in getExpenseDetails:', error)
    return { data: null, error: error.message }
  }
}

// Get transaction summary (1 row per transaction, aggregated)
export async function getTransactionSummary(startDate: string, endDate: string) {
  try {
    const supabase = createAuthClient()
    
    // Add one day to endDate to include the full end day
    const endDatePlusOne = new Date(endDate)
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1)
    
    // Get transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select(`
        id,
        invoice_number,
        created_at,
        total_amount,
        paid_amount,
        payment_method,
        order_status,
        pickup_date,
        customer:customers(name)
      `)
      .gte('created_at', startDate)
      .lt('created_at', endDatePlusOne.toISOString())
      .order('created_at', { ascending: true })

    if (txError) {
      console.error('Transaction error:', txError)
      return { data: null, error: txError.message }
    }

    if (!transactions || transactions.length === 0) {
      return { data: [], error: null }
    }

    // Get all transaction IDs
    const transactionIds = transactions.map(t => t.id)

    // Get transaction items for these transactions
    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select(`
        transaction_id,
        quantity,
        subtotal,
        service:services(name)
      `)
      .in('transaction_id', transactionIds)

    if (itemsError) {
      console.error('Items error:', itemsError)
      return { data: null, error: itemsError.message }
    }

    // Transform data to summary structure (1 row per transaction)
    const summaries: TransactionSummary[] = transactions.map((trans: any) => {
      // Find items for this transaction
      const transItems = items?.filter((item: any) => item.transaction_id === trans.id) || []
      
      // Aggregate data
      const totalWeight = transItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      const totalServices = transItems.length
      const remainingPayment = trans.total_amount - trans.paid_amount

      return {
        id: trans.id,
        date: trans.created_at,
        invoiceNumber: trans.invoice_number || '-',
        customerName: trans.customer?.name || 'Unknown',
        totalWeight,
        totalServices,
        totalAmount: trans.total_amount,
        paidAmount: trans.paid_amount,
        remainingPayment,
        paymentMethod: trans.payment_method,
        status: trans.order_status,
        pickupDate: trans.pickup_date || null
      }
    })

    return { data: summaries, error: null }
  } catch (error: any) {
    console.error('Unexpected error in getTransactionSummary:', error)
    return { data: null, error: error.message }
  }
}

