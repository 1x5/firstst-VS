import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Создаем клиент даже если переменные пустые (для сборки)
// Проверка будет в runtime
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Проверяем переменные в runtime
if (import.meta.env.PROD && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('⚠️ Missing Supabase environment variables!')
  console.error('Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

