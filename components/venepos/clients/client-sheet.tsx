"use client"

import { useState } from "react"
import { Client } from "@/types"
import { mockTerminals } from "@/lib/data"
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
  client: Client | null
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

function getGestionBadgeColor(gestion: string) {
  if (gestion.includes("GESTIONAR")) {
    return "bg-amber-100 text-amber-700 border-amber-200"
  }
  if (gestion.includes("ILOCALIZABLE")) {
    return "bg-rose-100 text-rose-700 border-rose-200"
  }
  if (gestion.includes("TALLER")) {
    return "bg-slate-100 text-slate-600 border-slate-200"
  }
  if (gestion.includes("CONTACTAR")) {
    return "bg-indigo-100 text-indigo-700 border-indigo-200"
  }
  return "bg-slate-100 text-slate-600 border-slate-200"
}

export function ClientSheet({ client, open, onOpenChange }: ClientSheetProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (!client) return null

  const initials = getInitials(client.name)
  const avatarColor = getAvatarColor(initials)
  const clientTerminals = mockTerminals.filter(t => t.clientId === client.id)

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
                  {client.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-[10px] px-2 py-0.5 font-semibold uppercase border ${getGestionBadgeColor(client.gestion)}`}>
                    {client.gestion}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  RIF: <span className="text-indigo-600 font-semibold">{client.codigoAfiliado}</span>
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
                    <Input defaultValue={client.name} />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </Label>
                  {isEditing ? (
                    <Input defaultValue="2714147116" />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">2714147116</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                    <Mail className="h-4 w-4" />
                    Email (CRM)
                  </Label>
                  {isEditing ? (
                    <Input 
                      type="email" 
                      defaultValue={`${client.name.toLowerCase().replace(/ /g, '.')}@gmail.com`} 
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {client.name.toLowerCase().replace(/ /g, '.')}@gmail.com
                    </p>
                  )}
                </div>

                {/* Código Afiliado */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                    <CreditCard className="h-4 w-4" />
                    Código Afiliado
                  </Label>
                  <p className="text-sm font-semibold text-slate-900">{client.codigoAfiliado}</p>
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
                  <p className="text-sm font-bold text-slate-900">{client.banco}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400 mb-1.5">Rango TX</p>
                  <p className="text-sm font-bold text-red-600">{client.rango}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Terminales */}
          <TabsContent value="pos" className="space-y-3 mt-4 px-0">
            {clientTerminals.length > 0 ? (
              clientTerminals.map((terminal) => (
                <div 
                  key={terminal.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Server className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{terminal.modelo}</h4>
                        <p className="text-xs text-slate-500">{terminal.serial}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        terminal.estadoPos === 'INSTALADO' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      PAX
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500">Operadora</p>
                      <p className="font-medium">{terminal.operadora}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Detalle</p>
                      <p className="font-medium">{terminal.modeloDetalle}</p>
                    </div>
                  </div>
                </div>
              ))
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
                <p className="text-sm font-semibold text-slate-900">CALLE PRINCIPAL</p>
              </div>

              {/* Estado y Ciudad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 font-normal">Estado</Label>
                  <p className="text-sm font-semibold text-slate-900">{client.estado}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 font-normal">Ciudad</Label>
                  <p className="text-sm font-semibold text-slate-900">{client.ciudad}</p>
                </div>
              </div>

              {/* Sector y Región */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 font-normal">Sector</Label>
                  <p className="text-sm font-semibold text-slate-900">GENERICO</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 font-normal">Región</Label>
                  <p className="text-sm font-semibold text-slate-900">{client.estado}</p>
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
