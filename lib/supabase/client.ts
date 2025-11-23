import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para uso en el navegador (Client Components)
 * 
 * Este cliente maneja automáticamente:
 * - Cookies para autenticación
 * - Renovación de sesiones
 * - Estado de autenticación en tiempo real
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
