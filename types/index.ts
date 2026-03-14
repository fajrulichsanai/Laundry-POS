import { Database } from './database.types'

export type User = Database['public']['Tables']['users']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionItem = Database['public']['Tables']['transaction_items']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']

// Extended types with relationships
export interface TransactionWithDetails extends Transaction {
  customer?: Customer
  user?: User
  items?: TransactionItem[]
}

export interface TransactionItemWithService extends TransactionItem {
  service?: Service
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface CustomerFormData {
  name: string
  phone: string
  email?: string
  address?: string
}

export interface ServiceFormData {
  name: string
  description?: string
  price_type: 'kg' | 'unit'
  price: number
  estimation_days: number
  active: boolean
}

export interface ExpenseFormData {
  category: string
  description: string
  amount: number
  date: string
}

// Dashboard stats type
export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  pendingOrders: number
  todayRevenue: number
  revenueChange: number
  ordersChange: number
}
