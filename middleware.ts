import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de Autenticación y Protección de Rutas
 * 
 * Este middleware maneja:
 * 1. Actualización automática de sesiones de Supabase
 * 2. Protección de rutas del dashboard (requiere autenticación)
 * 3. Redirección de usuarios autenticados desde login/register
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Crear cliente de Supabase con manejo de cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refrescar la sesión si es necesario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // =====================================================
  // RUTAS PROTEGIDAS: Requieren autenticación
  // =====================================================
  const protectedRoutes = [
    "/dashboard",
    "/clients",
    "/campaigns",
    "/import",
    "/settings",
    "/profile",
    "/auth/onboarding",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    // Usuario no autenticado tratando de acceder a ruta protegida
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // =====================================================
  // RUTAS DE AUTH: No permitir si ya está autenticado
  // =====================================================
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute && user) {
    // Usuario autenticado tratando de acceder a login/register
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  // =====================================================
  // REDIRECCIÓN DE RAÍZ
  // =====================================================
  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

/**
 * Configuración de rutas donde el middleware debe ejecutarse
 * 
 * Matcher optimizado para evitar ejecución en assets estáticos
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
