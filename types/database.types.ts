export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'cashier'
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'cashier'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'cashier'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          address: string | null
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          address?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          address?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          price_type: 'kg' | 'unit'
          price: number
          estimation_days: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_type: 'kg' | 'unit'
          price: number
          estimation_days?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_type?: 'kg' | 'unit'
          price?: number
          estimation_days?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          invoice_number: string
          customer_id: string
          user_id: string | null
          total_amount: number
          paid_amount: number
          payment_status: 'unpaid' | 'partial' | 'paid'
          order_status: 'processing' | 'done' | 'taken'
          notes: string | null
          estimated_completion_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          customer_id: string
          user_id?: string | null
          total_amount: number
          paid_amount?: number
          payment_status?: 'unpaid' | 'partial' | 'paid'
          order_status?: 'processing' | 'done' | 'taken'
          notes?: string | null
          estimated_completion_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          customer_id?: string
          user_id?: string | null
          total_amount?: number
          paid_amount?: number
          payment_status?: 'unpaid' | 'partial' | 'paid'
          order_status?: 'processing' | 'done' | 'taken'
          notes?: string | null
          estimated_completion_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          service_id: string | null
          service_name: string
          quantity: number
          price_at_time: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          service_id?: string | null
          service_name: string
          quantity: number
          price_at_time: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          service_id?: string | null
          service_name?: string
          quantity?: number
          price_at_time?: number
          subtotal?: number
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          category: string
          description: string
          amount: number
          date: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          description: string
          amount: number
          date: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          description?: string
          amount?: number
          date?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      daily_revenue: {
        Row: {
          date: string
          total_orders: number
          total_revenue: number
          avg_order_value: number
        }
      }
      service_popularity: {
        Row: {
          service_name: string
          order_count: number
          total_revenue: number
        }
      }
      top_customers: {
        Row: {
          name: string
          phone: string
          total_orders: number
          total_spent: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
