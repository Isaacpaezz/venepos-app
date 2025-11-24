"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Client } from "@/types"
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

// Función para obtener color del badge de gestión
function getGestionBadgeColor(gestion: string): string {
  if (gestion.includes("POR GESTIONAR")) {
    return "bg-amber-100 text-amber-700 border-amber-200 border hover:bg-amber-100"
  }
  if (gestion.includes("ILOCALIZABLE")) {
    return "bg-rose-100 text-rose-700 border-rose-200 border hover:bg-rose-100"
  }
  if (gestion.includes("EQUIPO EN TALLER")) {
    return "bg-slate-100 text-slate-600 border-slate-200 border hover:bg-slate-100"
  }
  if (gestion.includes("CONTACTAR")) {
    return "bg-indigo-100 text-indigo-700 border-indigo-200 border hover:bg-indigo-100"
  }
  return "bg-slate-100 text-slate-600 border-slate-200 border hover:bg-slate-100"
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

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Afiliado (Nombre / RIF)",
    cell: ({ row }) => {
      const client = row.original
      const initials = getInitials(client.name)
      const avatarColor = getAvatarColor(initials)
      
      return (
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center shrink-0`}>
            <span className="text-white text-sm font-semibold">{initials}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{client.name}</span>
            <span className="text-xs text-muted-foreground">
              {client.codigoAfiliado}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "gestion",
    header: "Gestión",
    cell: ({ row }) => {
      const gestion = row.getValue("gestion") as string
      return (
        <Badge className={`text-xs font-medium ${getGestionBadgeColor(gestion)}`}>
          {gestion}
        </Badge>
      )
    },
  },
  {
    accessorKey: "rango",
    header: "Rango TX",
    cell: ({ row }) => {
      const rango = row.getValue("rango") as string
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
    id: "region",
    header: "Región",
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{client.estado}</span>
          <span className="text-xs text-muted-foreground">{client.ciudad}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "terminalsCount",
    header: "POS",
    cell: ({ row }) => {
      const count = row.getValue("terminalsCount") as number
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
