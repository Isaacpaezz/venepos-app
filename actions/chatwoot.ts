"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Tipo de respuesta de la Server Action
 */
type ActionResponse<T = void> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

/**
 * Tipo para la configuraci?n de Chatwoot
 */
type ChatwootConfig = {
  baseUrl: string;
  accountId: string;
  token: string;
  inboxId?: string;
};

/**
 * Valida el formato de la URL base de Chatwoot
 */
function validateChatwootUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Normaliza la URL base eliminando trailing slashes
 */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Verifica las credenciales de Chatwoot haciendo una petici?n real a su API
 */
async function verifyChatwootCredentials(
  config: ChatwootConfig
): Promise<ActionResponse<{ agentName: string; inboxName?: string }>> {
  const { baseUrl, accountId, token, inboxId } = config;

  // Normalizar URL base
  const normalizedUrl = normalizeBaseUrl(baseUrl);

  try {
    // Intentar obtener el perfil del agente usando el token
    // Endpoint: GET /api/v1/accounts/{account_id}/profile
    const profileUrl = `${normalizedUrl}/api/v1/profile`;

    const response = await fetch(profileUrl, {
      method: "GET",
      headers: {
        "api_access_token": token,
        "Content-Type": "application/json",
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    });

    // Si la respuesta no es OK, las credenciales son inv?lidas
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Error desconocido");
      
      if (response.status === 401) {
        return {
          success: false,
          message: "Token de API inv?lido",
          error: "El token proporcionado no es v?lido o ha expirado",
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          message: "URL base o Account ID incorrectos",
          error: "No se pudo conectar con la API de Chatwoot. Verifica la URL base y el Account ID",
        };
      }

      return {
        success: false,
        message: "Error al conectar con Chatwoot",
        error: `Error HTTP ${response.status}: ${errorText}`,
      };
    }

    // Parsear respuesta JSON
    const data = await response.json();

    // Verificar que la respuesta contiene datos del perfil
    if (!data || !data.id) {
      return {
        success: false,
        message: "Respuesta inv?lida de Chatwoot",
        error: "La API de Chatwoot respondi? pero sin datos de perfil v?lidos",
      };
    }

    // Extraer nombre del agente
    const agentName = data.name || data.email || "Usuario de Chatwoot";

    // Si se proporcion? un inbox ID, verificar que existe
    let inboxName: string | undefined;
    if (inboxId) {
      try {
        const inboxUrl = `${normalizedUrl}/api/v1/accounts/${accountId}/inboxes/${inboxId}`;
        
        const inboxResponse = await fetch(inboxUrl, {
          method: "GET",
          headers: {
            "api_access_token": token,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!inboxResponse.ok) {
          return {
            success: false,
            message: "Inbox ID inv?lido",
            error: `No se encontr? el inbox con ID ${inboxId}. Verifica que el ID es correcto y que tienes acceso a ese inbox.`,
          };
        }

        const inboxData = await inboxResponse.json();
        inboxName = inboxData.name || `Inbox ${inboxId}`;
      } catch (error) {
        return {
          success: false,
          message: "Error al verificar Inbox",
          error: "No se pudo verificar el inbox. Verifica que el ID es correcto.",
        };
      }
    }

    return {
      success: true,
      message: "Credenciales verificadas correctamente",
      data: { agentName, inboxName },
    };
  } catch (error) {
    // Manejar errores de red o timeout
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        return {
          success: false,
          message: "Tiempo de espera agotado",
          error: "No se pudo conectar con Chatwoot. Verifica la URL base y tu conexi?n a internet",
        };
      }

      return {
        success: false,
        message: "Error de conexi?n",
        error: `No se pudo conectar con Chatwoot: ${error.message}`,
      };
    }

    return {
      success: false,
      message: "Error desconocido",
      error: "Ocurri? un error inesperado al validar las credenciales",
    };
  }
}

/**
 * Server Action: Verifica y guarda la configuraci?n de Chatwoot
 * 
 * Esta funci?n:
 * 1. Valida el formato de los datos de entrada
 * 2. Hace una petici?n real a la API de Chatwoot para verificar credenciales
 * 3. Verifica que el inbox ID existe
 * 4. Si las credenciales son v?lidas, las guarda en la base de datos
 * 5. Retorna el resultado de la operaci?n
 * 
 * @param baseUrl - URL base de la instancia de Chatwoot (ej: https://app.chatwoot.com)
 * @param accountId - ID de la cuenta en Chatwoot
 * @param token - Token de API de Chatwoot
 * @param inboxId - ID del inbox de WhatsApp/SMS en Chatwoot
 */
export async function verifyAndSaveChatwootConfig(
  baseUrl: string,
  accountId: string,
  token: string,
  inboxId: string
): Promise<ActionResponse<{ agentName: string }>> {
  try {
    // =====================================================
    // PASO 1: Validaci?n de entrada
    // =====================================================

    // Validar que todos los campos est?n presentes
    if (!baseUrl || !accountId || !token || !inboxId) {
      return {
        success: false,
        message: "Datos incompletos",
        error: "Todos los campos son requeridos: URL Base, Account ID, Token e Inbox ID",
      };
    }

    // Validar formato de URL
    if (!validateChatwootUrl(baseUrl)) {
      return {
        success: false,
        message: "URL inv?lida",
        error: "La URL base debe ser una URL v?lida que comience con http:// o https://",
      };
    }

    // Validar que el token no est? vac?o y tenga una longitud razonable
    if (token.trim().length < 20) {
      return {
        success: false,
        message: "Token inv?lido",
        error: "El token de API parece ser demasiado corto. Verifica que copiaste el token completo",
      };
    }

    // =====================================================
    // PASO 2: Verificar credenciales con la API de Chatwoot
    // =====================================================

    const verificationResult = await verifyChatwootCredentials({
      baseUrl,
      accountId,
      token,
      inboxId,
    });

    // Si la verificaci?n fall?, retornar el error
    if (!verificationResult.success) {
      return verificationResult;
    }

    // =====================================================
    // PASO 3: Obtener usuario autenticado y su organizaci?n
    // =====================================================

    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "No autenticado",
        error: "Debes iniciar sesi?n para actualizar la configuraci?n",
      };
    }

    // Obtener el perfil del usuario para encontrar su organization_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: "Perfil no encontrado",
        error: "No se pudo encontrar tu perfil. Contacta al administrador",
      };
    }

    // Verificar que el usuario tiene permisos de admin o owner
    if (!["admin", "owner"].includes(profile.role)) {
      return {
        success: false,
        message: "Permisos insuficientes",
        error: "Solo los administradores pueden actualizar la configuraci?n de Chatwoot",
      };
    }

    // =====================================================
    // PASO 4: Guardar configuraci?n en la base de datos
    // =====================================================

    const normalizedUrl = normalizeBaseUrl(baseUrl);

    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        chatwoot_base_url: normalizedUrl,
        chatwoot_account_id: accountId,
        chatwoot_api_token: token,
        chatwoot_inbox_id: inboxId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.organization_id);

    if (updateError) {
      console.error("Error al guardar configuraci?n de Chatwoot:", updateError);
      return {
        success: false,
        message: "Error al guardar",
        error: "No se pudo guardar la configuraci?n en la base de datos",
      };
    }

    // =====================================================
    // PASO 5: Revalidar cache y retornar ?xito
    // =====================================================

    // Revalidar la p?gina de configuraci?n para reflejar los cambios
    revalidatePath("/settings");

    return {
      success: true,
      message: "Configuraci?n guardada correctamente",
      data: {
        agentName: verificationResult.data?.agentName || "Usuario",
      },
    };
  } catch (error) {
    // Manejo de errores inesperados
    console.error("Error en verifyAndSaveChatwootConfig:", error);

    return {
      success: false,
      message: "Error del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Server Action: Obtiene la configuraci?n actual de Chatwoot
 * 
 * ?til para pre-llenar el formulario con los valores existentes
 */
export async function getChatwootConfig(): Promise<
  ActionResponse<{
    baseUrl: string | null;
    accountId: string | null;
    hasToken: boolean;
    inboxId: string | null;
  }>
> {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "No autenticado",
        error: "Debes iniciar sesi?n para ver la configuraci?n",
      };
    }

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: "Perfil no encontrado",
        error: "No se pudo encontrar tu perfil",
      };
    }

    // Obtener configuraci?n de Chatwoot de la organizaci?n
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("chatwoot_base_url, chatwoot_account_id, chatwoot_api_token, chatwoot_inbox_id")
      .eq("id", profile.organization_id)
      .single();

    if (orgError) {
      return {
        success: false,
        message: "Error al obtener configuraci?n",
        error: "No se pudo obtener la configuraci?n de la organizaci?n",
      };
    }

    return {
      success: true,
      message: "Configuraci?n obtenida",
      data: {
        baseUrl: organization.chatwoot_base_url || null,
        accountId: organization.chatwoot_account_id || null,
        hasToken: !!organization.chatwoot_api_token,
        inboxId: organization.chatwoot_inbox_id || null,
      },
    };
  } catch (error) {
    console.error("Error en getChatwootConfig:", error);

    return {
      success: false,
      message: "Error del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
