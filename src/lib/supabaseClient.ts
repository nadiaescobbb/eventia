import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://izwlzlbjjxpqrctvcyfu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key';

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Advertencia: VITE_SUPABASE_URL no está configurado correctamente en el archivo .env');
}

/**
 * Cliente oficial de Supabase para consumir Auth y la Base de Datos PostgreSQL.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
