import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zxyldfpfsdjzhwpxzzsf.supabase.co' // ⬅️ reemplaza esto
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eWxkZnBmc2Rqemh3cHh6enNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjgyMDQsImV4cCI6MjA2NzEwNDIwNH0.St3g5r1mKPBsn6JfGyr_HCuqlUQpisC_4eGxVOwpW_k' // ⬅️ pega aquí tu anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
