"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Tipo de respuesta estándar para las Server Actions de autenticación
 */
type AuthActionResponse = {
  success: boolean;
  message: string;
  error?: string;
  field?: string; // Campo específico donde ocurrió el error
};

/**
 * Server Action: Iniciar Sesión
 * 
 * Autentica un usuario con email y contraseña
 * 
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @returns Respuesta con el resultado de la operación
 */
export async function loginAction(
  email: string,
  password: string
): Promise<AuthActionResponse> {
  try {
    // Validación de entrada
    if (!email || !password) {
      return {
        success: false,
        message: "Credenciales incompletas",
        error: "El email y la contraseña son requeridos",
        field: !email ? "email" : "password",
      };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: "Email inválido",
        error: "Por favor ingresa un email válido",
        field: "email",
      };
    }

    const supabase = await createClient();

    // Intentar iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error en login:", error);

      // Manejar errores específicos
      if (error.message.includes("Invalid login credentials")) {
        return {
          success: false,
          message: "Credenciales incorrectas",
          error: "El email o la contraseña son incorrectos",
        };
      }

      if (error.message.includes("Email not confirmed")) {
        return {
          success: false,
          message: "Email no confirmado",
          error: "Por favor confirma tu email antes de iniciar sesión",
          field: "email",
        };
      }

      return {
        success: false,
        message: "Error al iniciar sesión",
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: "Error al iniciar sesión",
        error: "No se pudo obtener la información del usuario",
      };
    }

    // Revalidar rutas para actualizar el estado de autenticación
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Sesión iniciada correctamente",
    };
  } catch (error) {
    console.error("Error inesperado en loginAction:", error);

    return {
      success: false,
      message: "Error del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Server Action: Registrar Usuario
 * 
 * Crea una nueva cuenta de usuario con organización y perfil
 * El trigger de base de datos se encarga de crear automáticamente
 * la organización y el perfil del usuario
 * 
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @param fullName - Nombre completo del usuario
 * @param organizationName - Nombre de la organización/empresa
 * @returns Respuesta con el resultado de la operación
 */
export async function signupAction(
  email: string,
  password: string,
  fullName: string,
  organizationName: string
): Promise<AuthActionResponse> {
  try {
    // =====================================================
    // VALIDACIÓN DE ENTRADA
    // =====================================================

    if (!email || !password || !fullName || !organizationName) {
      return {
        success: false,
        message: "Datos incompletos",
        error: "Todos los campos son requeridos",
        field: !email
          ? "email"
          : !password
          ? "password"
          : !fullName
          ? "fullName"
          : "organizationName",
      };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: "Email inválido",
        error: "Por favor ingresa un email válido",
        field: "email",
      };
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return {
        success: false,
        message: "Contraseña muy corta",
        error: "La contraseña debe tener al menos 6 caracteres",
        field: "password",
      };
    }

    // Validar que el nombre no esté vacío
    if (fullName.trim().length < 2) {
      return {
        success: false,
        message: "Nombre inválido",
        error: "El nombre debe tener al menos 2 caracteres",
        field: "fullName",
      };
    }

    // Validar que el nombre de la organización no esté vacío
    if (organizationName.trim().length < 2) {
      return {
        success: false,
        message: "Nombre de empresa inválido",
        error: "El nombre de la empresa debe tener al menos 2 caracteres",
        field: "organizationName",
      };
    }

    const supabase = await createClient();

    // =====================================================
    // CREAR USUARIO EN SUPABASE AUTH
    // =====================================================
    // Los metadatos (data) se usan en el trigger para crear
    // la organización y el perfil automáticamente
    // =====================================================

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          organization_name: organizationName.trim(),
        },
        // Opcional: Configurar URL de confirmación de email
        // emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error en signup:", error);

      // Manejar errores específicos
      if (error.message.includes("User already registered")) {
        return {
          success: false,
          message: "Email ya registrado",
          error: "Este email ya está en uso. Por favor inicia sesión o usa otro email",
          field: "email",
        };
      }

      if (error.message.includes("Password should be")) {
        return {
          success: false,
          message: "Contraseña débil",
          error: error.message,
          field: "password",
        };
      }

      return {
        success: false,
        message: "Error al crear cuenta",
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: "Error al crear cuenta",
        error: "No se pudo crear el usuario",
      };
    }

    // =====================================================
    // VERIFICAR QUE EL TRIGGER CREÓ EL PERFIL
    // =====================================================
    // Esperar un momento para que el trigger se ejecute
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, organization_id, full_name, role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error al verificar perfil:", profileError);
      
      // El usuario se creó pero no el perfil
      // Esto puede indicar un problema con el trigger
      return {
        success: false,
        message: "Error de configuración",
        error: "La cuenta se creó pero hubo un problema al inicializar el perfil. Por favor contacta al soporte",
      };
    }

    // =====================================================
    // REGISTRO EXITOSO
    // =====================================================

    // Revalidar rutas
    revalidatePath("/", "layout");

    return {
      success: true,
      message: data.user.confirmed_at
        ? "Cuenta creada exitosamente"
        : "Cuenta creada. Por favor confirma tu email para continuar",
    };
  } catch (error) {
    console.error("Error inesperado en signupAction:", error);

    return {
      success: false,
      message: "Error del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Server Action: Cerrar Sesión
 * 
 * Cierra la sesión del usuario actual
 * 
 * @returns Respuesta con el resultado de la operación
 */
export async function signOutAction(): Promise<AuthActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error al cerrar sesión:", error);

      return {
        success: false,
        message: "Error al cerrar sesión",
        error: error.message,
      };
    }

    // Revalidar todas las rutas para limpiar el estado
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Sesión cerrada correctamente",
    };
  } catch (error) {
    console.error("Error inesperado en signOutAction:", error);

    return {
      success: false,
      message: "Error del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Server Action: Obtener Usuario Actual
 * 
 * Obtiene la información del usuario autenticado con su perfil
 * 
 * @returns Usuario con perfil o null si no está autenticado
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id,
        organization_id,
        full_name,
        role,
        avatar_url,
        created_at,
        organizations (
          id,
          name,
          chatwoot_base_url,
          chatwoot_account_id
        )
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error al obtener perfil:", profileError);
      return null;
    }

    return {
      ...user,
      profile,
    };
  } catch (error) {
    console.error("Error en getCurrentUser:", error);
    return null;
  }
}

/**
 * Server Action: Redirigir a Dashboard (después de login exitoso)
 * 
 * Esta función se llama después de un login exitoso para redirigir
 * al usuario al dashboard
 */
export async function redirectToDashboard() {
  redirect("/dashboard");
}

/**
 * Server Action: Redirigir a Onboarding (después de registro exitoso)
 * 
 * Esta función se llama después de un registro exitoso para redirigir
 * al usuario al proceso de onboarding
 */
export async function redirectToOnboarding() {
  redirect("/auth/onboarding");
}
