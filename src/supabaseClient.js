import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.warn('Falta configurar las credenciales de Supabase en el archivo .env')
}

export const supabase = createClient(
  supabaseUrl === 'YOUR_SUPABASE_URL' ? 'https://example.supabase.co' : supabaseUrl,
  supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ? 'dummy-key' : supabaseAnonKey
)
