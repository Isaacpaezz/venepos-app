"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ClientWithTerminals } from "@/actions/clients"
import { DataTable } from "./data-table"
import { ClientSheet } from "./client-sheet"
import { Table } from "@tanstack/react-table"

interface ClientTableWrapperProps {
  columns: ColumnDef<ClientWithTerminals>[]
  data: ClientWithTerminals[]
  filterComponent?: (table: Table<ClientWithTerminals>) => React.ReactNode
}

export function ClientTableWrapper({ 
  columns, 
  data,
  filterComponent 
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
        filterComponent={filterComponent}
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
