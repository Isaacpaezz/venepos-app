import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para uso en el servidor (Server Components, Server Actions, Route Handlers)
 * 
 * Este cliente maneja automáticamente:
 * - Lectura y escritura de cookies para autenticación
 * - Sesiones de usuario en el servidor
 * - Row Level Security (RLS) basado en el usuario autenticado
 * 
 * IMPORTANTE: Este debe ser llamado en cada request, no reutilizar la instancia
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método `setAll` fue llamado desde un Server Component
            // Esto puede ser ignorado si tienes middleware que refresca cookies
          }
        },
      },
    }
  );
}
