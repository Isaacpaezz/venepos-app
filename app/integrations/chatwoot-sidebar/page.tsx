"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { clientsData } from "@/lib/data"
import { Client } from "@/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ExternalLink,
  DollarSign,
  CreditCard,
  UserPlus,
  AlertCircle,
} from "lucide-react"

function ChatwootSidebarContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [client, setClient] = useState<Client | null>(null)

  useEffect(() => {
    if (email) {
      // Buscar cliente por email
      const foundClient = clientsData.find(
        (c) => c.email?.toLowerCase() === email.toLowerCase()
      )
      setClient(foundClient || null)
    }
  }, [email])

  if (!email) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600">
          No se proporcionó un email en la URL.
        </p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen">
        {/* Empty State */}
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <UserPlus className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Cliente no registrado
            </h3>
            <p className="text-xs text-slate-500">
              Este contacto no existe en VenePOS.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 w-full"
            onClick={() => window.open("/clients", "_blank")}
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Crear Afiliado
          </Button>
        </div>
      </div>
    )
  }

  // Cliente encontrado
  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      {/* Header Compacto */}
      <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
              {client.initials || client.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {client.name}
            </h3>
            <p className="text-xs text-slate-500 truncate">{client.rif}</p>
            <div className="mt-1">
              <Badge
                className={`text-xs ${
                  client.rango.includes("SIN TX")
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                }`}
              >
                {client.rango}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Mini Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-3 w-3 text-indigo-600" />
            <span className="text-xs text-slate-500">Terminales</span>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {client.terminalsCount}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-3 w-3 text-emerald-600" />
            <span className="text-xs text-slate-500">Deuda</span>
          </div>
          <p className="text-lg font-bold text-slate-900">$0</p>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-2">
        <h4 className="text-xs font-semibold text-slate-700 uppercase">
          Información
        </h4>
        <div className="space-y-1.5">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500">Banco:</span>
            <span className="text-xs font-medium text-slate-900 text-right">
              {client.banco}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500">Región:</span>
            <span className="text-xs font-medium text-slate-900 text-right">
              {client.region}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500">Ciudad:</span>
            <span className="text-xs font-medium text-slate-900 text-right">
              {client.ciudad}, {client.estado}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500">Teléfono:</span>
            <span className="text-xs font-medium text-slate-900 text-right">
              {client.telefono}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start text-xs"
          onClick={() => window.open(`/clients?id=${client.id}`, "_blank")}
        >
          <ExternalLink className="h-3 w-3 mr-2" />
          Ver en VenePOS
        </Button>
        <Button
          size="sm"
          className="w-full justify-start text-xs bg-emerald-600 hover:bg-emerald-700"
        >
          <DollarSign className="h-3 w-3 mr-2" />
          Reportar Pago
        </Button>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">
          Código: {client.codigoAfiliado}
        </p>
      </div>
    </div>
  )
}

export default function ChatwootSidebarPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-center">
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      }
    >
      <ChatwootSidebarContent />
    </Suspense>
  )
}
