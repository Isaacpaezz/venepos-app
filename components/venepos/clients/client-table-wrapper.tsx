"use client"

import { useState } from "react"
import { ClientWithTerminals } from "@/actions/clients"
import { DataTable } from "./data-table"
import { ClientSheet } from "./client-sheet"
import { ClientFilters } from "./client-filters"
import { columns } from "./columns"

interface ClientTableWrapperProps {
  data: ClientWithTerminals[]
}

export function ClientTableWrapper({ 
  data,
}: ClientTableWrapperProps) {
  const [selectedClient, setSelectedClient] = useState<ClientWithTerminals | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleRowClick = (client: ClientWithTerminals) => {
    setSelectedClient(client)
    setIsSheetOpen(true)
  }

  return (
    <>
      <DataTable 
        columns={columns} 
        data={data}
        filterComponent={(table) => <ClientFilters table={table} />}
        onRowClick={handleRowClick}
      />

      <ClientSheet 
        client={selectedClient}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  )
}
