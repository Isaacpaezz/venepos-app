"use client"

import { useState, useEffect } from "react"
import { clientsData } from "@/lib/data"
import { columns } from "@/components/venepos/clients/columns"
import { DataTable } from "@/components/venepos/clients/data-table"
import { ClientFilters } from "@/components/venepos/clients/client-filters"
import { ClientSheet } from "@/components/venepos/clients/client-sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Plus, Search, CreditCard, MapPin } from "lucide-react"
import { Client } from "@/types"

export default function ClientsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState(clientsData)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    // Simular carga asíncrona de datos
    const timer = setTimeout(() => {
      setData(clientsData)
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  const handleRowClick = (client: Client) => {
    setSelectedClient(client)
    setIsSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Desktop */}
      <div className="hidden md:flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Clientes y Afiliados
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona la cartera de afiliados POS basada en tu archivo maestro.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Importar Clientes
          </Button>
        </div>
      </div>

      {/* Header Móvil */}
      <div className="md:hidden space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Clientes y Afiliados
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Gestiona la cartera de afiliados POS basada en tu archivo maestro.
          </p>
        </div>
        <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-5 w-5" />
          Nuevo
        </Button>
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block">
        {isLoading ? (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 flex-1 max-w-sm" />
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[140px]" />
              </div>
              <Skeleton className="h-[400px] w-full" />
            </div>
          </Card>
        ) : (
          <DataTable 
            columns={columns} 
            data={data}
            filterComponent={(table) => <ClientFilters table={table} />}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      {/* Vista Móvil - Cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {/* Barra de búsqueda móvil */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, RIF o código..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filtros móviles */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button className="shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white">
                <Plus className="h-4 w-4" />
                Gestión
              </button>
              <button className="shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white">
                <CreditCard className="h-4 w-4" />
                Banco
              </button>
              <button className="shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white">
                <MapPin className="h-4 w-4" />
                Región
              </button>
            </div>

            {/* Cards de clientes */}
            <div className="space-y-3">
              {data.map((client) => {
                const initials = client.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                const colors = ["bg-indigo-500", "bg-blue-500", "bg-purple-500", "bg-pink-500"]
                const avatarColor = colors[initials.charCodeAt(0) % colors.length]

                return (
                  <Card 
                    key={client.codigoAfiliado} 
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleRowClick(client)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-12 w-12 rounded-full ${avatarColor} flex items-center justify-center shrink-0`}>
                        <span className="text-white font-semibold">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{client.name}</h3>
                            <p className="text-xs text-slate-500">{client.codigoAfiliado}</p>
                          </div>
                          <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${
                            client.gestion.includes("GESTIONAR")
                              ? "bg-amber-100 text-amber-700"
                              : client.gestion.includes("ILOCALIZABLE")
                              ? "bg-rose-100 text-rose-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}>
                            {client.gestion}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 pt-3 border-t">
                          <div>
                            <p className="text-xs text-slate-500">Banco</p>
                            <p className="text-sm font-medium">{client.banco}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Rango TX</p>
                            <p className="text-sm font-medium text-red-600">{client.rango}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Sheet de detalle del cliente */}
      <ClientSheet 
        client={selectedClient}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  )
}
