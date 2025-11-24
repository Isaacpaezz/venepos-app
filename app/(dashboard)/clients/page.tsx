import { columns } from "@/components/venepos/clients/columns"
import { DataTable } from "@/components/venepos/clients/data-table"
import { ClientFilters } from "@/components/venepos/clients/client-filters"
import { ClientTableWrapper } from "@/components/venepos/clients/client-table-wrapper"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getClients } from "@/actions/clients"
import Link from "next/link"

export default async function ClientsPage() {
  const supabase = await createClient()

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Obtener organización del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Error
          </h2>
          <p className="text-sm text-red-500 mt-1">
            No se pudo obtener la información del perfil
          </p>
        </div>
      </div>
    )
  }

  // Obtener clientes con sus terminales
  const clients = await getClients(profile.organization_id)

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
          <Link href="/import">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              Importar Clientes
            </Button>
          </Link>
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
        <Link href="/import" className="w-full">
          <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-5 w-5" />
            Importar
          </Button>
        </Link>
      </div>

      {/* Client Table Wrapper (maneja estado del Sheet en client component) */}
      <ClientTableWrapper 
        columns={columns}
        data={clients}
        filterComponent={(table) => <ClientFilters table={table} />}
      />
    </div>
  )
}
