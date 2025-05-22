import { createClient } from '@supabase/supabase-js'

// ✅ Vite 클라이언트용과 Vercel API 서버용 모두 호환 가능하도록 설정
const supabaseUrl =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
