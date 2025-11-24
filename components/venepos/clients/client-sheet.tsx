"use client"

import { useState } from "react"
import { ClientWithTerminals } from "@/actions/clients"
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Edit2, 
  Phone, 
  MessageCircle,
  User,
  Mail,
  CreditCard,
  MapPin,
  Server
} from "lucide-react"

interface ClientSheetProps {
  client: ClientWithTerminals | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function getAvatarColor(initials: string): string {
  const colors = [
    "bg-indigo-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-teal-500",
  ]
  const index = initials.charCodeAt(0) % colors.length
  return colors[index]
}

function getRangoBadgeColor(rango: string) {
  const rangoLower = rango.toLowerCase()
  
  if (rangoLower.includes("sin tx en el mes actual")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200"
  }
  if (rangoLower.includes("30 dias")) {
    return "bg-amber-100 text-amber-700 border-amber-200"
  }
  if (rangoLower.includes("60 dias") || rangoLower.includes("120 dias")) {
    return "bg-red-100 text-red-700 border-red-200"
  }
  return "bg-slate-100 text-slate-600 border-slate-200"
}

export function ClientSheet({ client, open, onOpenChange }: ClientSheetProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (!client) return null

  const initials = getInitials(client.nombre)
  const avatarColor = getAvatarColor(initials)
  const clientTerminals = client.terminals || []

  const handleSave = () => {
    // TODO: Guardar cambios en la base de datos
    setIsEditing(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="space-y-0 p-6 pb-4 border-b">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              {/* Avatar grande */}
              <div className={`h-14 w-14 rounded-full ${avatarColor} flex items-center justify-center shrink-0`}>
                <span className="text-white text-lg font-bold">{initials}</span>
              </div>
              
              {/* Info del cliente */}
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {client.nombre}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-[10px] px-2 py-0.5 font-semibold uppercase border ${getRangoBadgeColor(clientTerminals[0]?.rango || "Sin datos")}`}>
                    {clientTerminals[0]?.rango || "Sin datos"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  RIF: <span className="text-indigo-600 font-semibold">{client.rif}</span>
                </p>
              </div>
            </div>

            {/* Botón de edición */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
              className="h-9 w-9"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Botones de contacto */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2">
              <Phone className="h-4 w-4" />
              Llamar
            </Button>
            <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="general" className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pos">POS ({clientTerminals.length})</TabsTrigger>
            <TabsTrigger value="ubicacion">Ubicación</TabsTrigger>
          </TabsList>

          {/* Tab General */}
          <TabsContent value="general" className="space-y-6 mt-4 px-0">
            <div>
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Datos del Afiliado
              </h3>
              
              <div className="space-y-3">
                {/* Persona Contacto */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                    <User className="h-4 w-4" />
                    Persona Contacto
                  </Label>
                  {isEditing ? (
                    <Input defaultValue={client.persona_contacto || client.nombre} />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">{client.persona_contacto || client.nombre}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </Label>
                  {isEditing ? (
                    <Input defaultValue={client.telefono || ""} />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">{client.telefono || "Sin teléfono"}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input 
                      type="email" 
                      defaultValue={client.email || ""} 
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {client.email || "Sin email"}
                    </p>
                  )}
                </div>

                {/* Código Afiliado */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                    <CreditCard className="h-4 w-4" />
                    Código Afiliado
                  </Label>
                  <p className="text-sm font-semibold text-slate-900">{client.codigo_afiliado}</p>
                </div>

                {/* Dirección */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </Label>
                  {isEditing ? (
                    <Input defaultValue={client.direccion || ""} />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">{client.direccion || "Sin dirección"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Clasificación */}
            <div>
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Clasificación
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 mb-1.5">Categoría</p>
                  <p className="text-sm font-bold text-slate-900">{client.categoria || "Sin categoría"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 mb-1.5">Banco</p>
                  <p className="text-sm font-bold text-slate-900">{client.banco || "Sin banco"}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Terminales */}
          <TabsContent value="pos" className="space-y-3 mt-4 px-0">
            {clientTerminals.length > 0 ? (
              clientTerminals.map((terminal) => {
                const datosTecnicos = terminal.datos_tecnicos_json
                return (
                  <div 
                    key={terminal.afipos}
                    className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Server className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{datosTecnicos?.modelo || "Sin modelo"}</h4>
                          <p className="text-xs text-slate-500">AFIPOS: {terminal.afipos}</p>
                        </div>
                      </div>
                      <Badge 
                        className={`text-xs ${
                          terminal.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : terminal.status === 'recovered'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {datosTecnicos?.marca || "Sin marca"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <p className="text-slate-500">Serial</p>
                        <p className="font-medium">{datosTecnicos?.serial || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Operadora</p>
                        <p className="font-medium">{datosTecnicos?.operadora || "N/A"}</p>
                      </div>
                    </div>

                    {/* Rango de este terminal */}
                    <div className="pt-3 border-t">
                      <Badge className={`text-xs ${getRangoBadgeColor(terminal.rango || "Sin datos")}`}>
                        {terminal.rango || "Sin datos"}
                      </Badge>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Server className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No hay terminales asociados</p>
              </div>
            )}
          </TabsContent>

          {/* Tab Ubicación */}
          <TabsContent value="ubicacion" className="space-y-3 mt-4 px-0">
            <div className="space-y-3">
              {/* Dirección */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                  <MapPin className="h-4 w-4" />
                  Dirección Fiscal
                </Label>
                <p className="text-sm font-semibold text-slate-900">{client.direccion || "Sin dirección"}</p>
              </div>

              {/* Estado y Ciudad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 font-normal">Estado</Label>
                  <p className="text-sm font-semibold text-slate-900">{client.ubicacion_json?.estado || "Sin estado"}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 font-normal">Ciudad</Label>
                  <p className="text-sm font-semibold text-slate-900">{client.ubicacion_json?.ciudad || "Sin ciudad"}</p>
                </div>
              </div>

              {/* Sector y Región */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 font-normal">Sector</Label>
                  <p className="text-sm font-semibold text-slate-900">{client.ubicacion_json?.sector || "Sin sector"}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 font-normal">Región</Label>
                  <p className="text-sm font-semibold text-slate-900">{client.ubicacion_json?.region || "Sin región"}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer - Botón Guardar (solo en modo edición) */}
        {isEditing && (
          <div className="sticky bottom-0 left-0 right-0 p-6 bg-white border-t">
            <Button 
              onClick={handleSave}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Guardar Cambios
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
