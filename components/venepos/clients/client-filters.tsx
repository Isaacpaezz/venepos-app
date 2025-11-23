"use client"

import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, PlusCircle, CreditCard, MapPin } from "lucide-react"
import { Client } from "@/types"

interface ClientFiltersProps {
  table: Table<Client>
}

export function ClientFilters({ table }: ClientFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Búsqueda */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, RIF o código..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="pl-9 h-9 text-sm border-slate-200"
        />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <PlusCircle className="h-4 w-4" />
          <span>Gestión</span>
        </button>
        <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <CreditCard className="h-4 w-4" />
          <span>Banco</span>
        </button>
        <button className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <MapPin className="h-4 w-4" />
          <span>Región</span>
        </button>
      </div>
    </div>
  )
}
