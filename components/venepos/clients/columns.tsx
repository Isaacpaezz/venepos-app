"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ClientWithTerminals, getMostCriticalRango } from "@/actions/clients"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, History } from "lucide-react"

// Función para obtener iniciales del nombre
function getInitials(name: string): string {
  const words = name.split(" ")
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Función para generar color del avatar basado en las iniciales
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
  
  // Verde: Terminal activo (sin problemas)
  if (rangoLower.includes("sin tx en el mes actual")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 border hover:bg-emerald-100 font-medium"
  }
  
  // Amarillo: Inactividad media (30 días)
  if (rangoLower.includes("30 dias")) {
    return "bg-amber-100 text-amber-700 border-amber-200 border hover:bg-amber-100 font-medium"
  }
  
  // Rojo: Inactividad alta (>60 días, >120 días, etc)
  if (rangoLower.includes("60 dias") || rangoLower.includes("120 dias") || rangoLower.includes("> 60")) {
    return "bg-red-100 text-red-700 border-red-200 border hover:bg-red-100 font-medium"
  }
  
  // Por defecto (gris)
  return "bg-slate-100 text-slate-600 border-slate-200 border hover:bg-slate-100"
}

export const columns: ColumnDef<ClientWithTerminals>[] = [
  {
    accessorKey: "nombre",
    header: "Afiliado (Nombre / RIF)",
    cell: ({ row }) => {
      const client = row.original
      const initials = getInitials(client.nombre)
      const avatarColor = getAvatarColor(initials)
      
      return (
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center shrink-0`}>
            <span className="text-white text-sm font-semibold">{initials}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{client.nombre}</span>
            <span className="text-xs text-muted-foreground">
              {client.rif}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "categoria",
    header: "Categoría",
    cell: ({ row }) => {
      const categoria = row.getValue("categoria") as string | null
      return (
        <div className="text-sm">
          {categoria || "Sin categoría"}
        </div>
      )
    },
  },
  {
    id: "rango",
    header: "Rango TX",
    cell: ({ row }) => {
      const client = row.original
      const rango = getMostCriticalRango(client.terminals)
      return (
        <Badge className={`text-xs ${getRangoBadgeColor(rango)}`}>
          {rango}
        </Badge>
      )
    },
  },
  {
    accessorKey: "banco",
    header: "Banco",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {row.getValue("banco")}
        </div>
      )
    },
  },
  {
    id: "ubicacion",
    header: "Ubicación",
    cell: ({ row }) => {
      const client = row.original
      const ubicacion = client.ubicacion_json
      const estado = ubicacion?.estado || "Sin estado"
      const ciudad = ubicacion?.ciudad || "Sin ciudad"
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{estado}</span>
          <span className="text-xs text-muted-foreground">{ciudad}</span>
        </div>
      )
    },
  },
  {
    id: "terminals_count",
    header: "POS",
    cell: ({ row }) => {
      const client = row.original
      const count = client.terminals?.length || 0
      return (
        <span className="text-sm font-semibold">{count}</span>
      )
    },
  },
  {
    id: "acciones",
    header: "",
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalles
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <History className="mr-2 h-4 w-4" />
              Historial
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
