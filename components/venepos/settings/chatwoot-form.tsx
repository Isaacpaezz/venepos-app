"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { verifyAndSaveChatwootConfig, getChatwootConfig } from "@/actions/chatwoot"

export function ChatwootForm() {
  const [showToken, setShowToken] = useState(false)
  const [autoSync, setAutoSync] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    baseUrl: "",
    accountId: "",
    apiToken: "",
    inboxId: "",
  })

  // Cargar configuración existente al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const result = await getChatwootConfig()
        
        if (result.success && result.data) {
          setFormData({
            baseUrl: result.data.baseUrl || "",
            accountId: result.data.accountId || "",
            apiToken: result.data.hasToken ? "••••••••••••••••••••" : "",
            inboxId: result.data.inboxId || "",
          })
          
          // Si hay configuración guardada, considerarla como conectada
          if (result.data.hasToken && result.data.baseUrl && result.data.accountId && result.data.inboxId) {
            setIsConnected(true)
          }
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  const handleVerifyAndSave = () => {
    // Limpiar mensajes anteriores
    setError(null)
    setSuccessMessage(null)

    // Validar campos vacíos
    if (!formData.baseUrl || !formData.accountId || !formData.apiToken || !formData.inboxId) {
      setError("Todos los campos son requeridos")
      toast.error("Todos los campos son requeridos")
      return
    }

    // Si el token es el placeholder, mostrar error
    if (formData.apiToken === "••••••••••••••••••••") {
      setError("Debes ingresar un token válido")
      toast.error("Debes ingresar un token válido")
      return
    }

    startTransition(async () => {
      try {
        const result = await verifyAndSaveChatwootConfig(
          formData.baseUrl,
          formData.accountId,
          formData.apiToken,
          formData.inboxId
        )

        if (result.success) {
          setIsConnected(true)
          setSuccessMessage(
            `✅ Conexión verificada y guardada. Bienvenido, ${result.data?.agentName}!`
          )
          toast.success(result.message, {
            description: `Conectado como ${result.data?.agentName}`,
          })
          
          // Ocultar el token después de guardarlo
          setFormData(prev => ({
            ...prev,
            apiToken: "••••••••••••••••••••"
          }))
        } else {
          setIsConnected(false)
          setError(result.error || result.message)
          toast.error(result.message, {
            description: result.error,
          })
        }
      } catch (error) {
        setIsConnected(false)
        setError("Error inesperado al conectar con Chatwoot")
        toast.error("Error inesperado", {
          description: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Chatwoot Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Chatwoot</CardTitle>
                <CardDescription>
                  Plataforma de interacción con clientes (Open Source).
                </CardDescription>
              </div>
            </div>
            {isConnected ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Conectado
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                Desconectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chatwoot Base URL */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Chatwoot Base URL</Label>
              <Input
                id="baseUrl"
                value={formData.baseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, baseUrl: e.target.value })
                }
                placeholder="https://chat.venepos.com"
              />
              <p className="text-xs text-slate-500">
                La URL donde está alojada tu instancia.
              </p>
            </div>

            {/* Account ID */}
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                placeholder="2"
              />
              <p className="text-xs text-slate-500">
                ID numérico de tu cuenta en Chatwoot.
              </p>
            </div>
          </div>

          {/* Inbox ID */}
          <div className="space-y-2">
            <Label htmlFor="inboxId">
              Inbox ID (WhatsApp/SMS)
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="inboxId"
              value={formData.inboxId}
              onChange={(e) =>
                setFormData({ ...formData, inboxId: e.target.value })
              }
              placeholder="1"
            />
            <p className="text-xs text-slate-500">
              El ID numérico de tu bandeja de entrada (inbox) de WhatsApp o SMS en Chatwoot.
              <br />
              <span className="text-xs text-slate-400">
                💡 Puedes encontrarlo en la URL cuando editas el inbox: <code>/app/accounts/1/settings/inboxes/<strong>123</strong></code>
              </span>
            </p>
          </div>

          {/* User API Access Token */}
          <div className="space-y-2">
            <Label htmlFor="apiToken">User API Access Token</Label>
            <div className="relative">
              <Input
                id="apiToken"
                type={showToken ? "text" : "password"}
                value={formData.apiToken}
                onChange={(e) =>
                  setFormData({ ...formData, apiToken: e.target.value })
                }
                placeholder="Ingresa tu token de API"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Este token se usará para crear contactos y enviar mensajes en tu
              nombre.
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleVerifyAndSave}
              disabled={isPending || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando y Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Verificar y Guardar
                </>
              )}
            </Button>
            {isLoading && (
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando configuración...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Automatización Card */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Automatización de Estados (Etiquetas)
              </CardTitle>
              <CardDescription>
                Actualiza el estado del cliente en VenePOS cuando se asigna una
                etiqueta en Chatwoot.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reglas de mapeo */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-slate-500 uppercase">
              Si la etiqueta es...
            </Label>
            
            {[
              { tag: "pago-confirmado", status: "Activo", color: "emerald" },
              { tag: "no-interesado", status: "Inactivo", color: "slate" },
              { tag: "negociacion", status: "Pendiente", color: "amber" },
            ].map((rule, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center p-3 bg-slate-50 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">#</span>
                  <Input
                    value={rule.tag}
                    readOnly
                    className="h-8 text-sm bg-white"
                  />
                </div>
                <span className="text-slate-400">→</span>
                <Input
                  value={rule.status}
                  readOnly
                  className="h-8 text-sm bg-white"
                />
                <Button variant="ghost" size="icon-sm" className="text-slate-400">
                  <AlertCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="link" className="text-purple-600 p-0 h-auto">
            + Agregar Regla
          </Button>

          <div className="pt-4 border-t">
            <Button className="bg-slate-900 hover:bg-slate-800">
              Guardar Reglas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
