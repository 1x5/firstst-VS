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
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          category_name: string
          description: string | null
          date: string
          is_recurring: boolean
          recurring_interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          category_name: string
          description?: string | null
          date: string
          is_recurring?: boolean
          recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category: string
          category_name?: string
          description?: string | null
          date?: string
          is_recurring?: boolean
          recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'income' | 'expense'
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          action: 'added' | 'updated' | 'deleted'
          amount: number | null
          description: string | null
          category_name: string | null
          transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          action: 'added' | 'updated' | 'deleted'
          amount?: number | null
          description?: string | null
          category_name?: string | null
          transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          action?: 'added' | 'updated' | 'deleted'
          amount?: number | null
          description?: string | null
          category_name?: string | null
          transaction_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
