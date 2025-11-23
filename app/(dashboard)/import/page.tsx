import { FileUpload } from "@/components/venepos/import/file-upload"
import { ImportHistory } from "@/components/venepos/import/import-history"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ImportPage() {
  const supabase = await createClient()

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Obtener organización del usuario
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("Error obteniendo perfil:", profileError)
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Importar Datos
          </h2>
          <p className="text-sm text-red-500 mt-1">
            Error: No se pudo obtener la información del perfil
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Importar Datos
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Carga masiva de clientes y terminales mediante archivo maestro Excel.
        </p>
      </div>

      {/* File Upload */}
      <FileUpload
        organizationId={profile.organization_id}
        userId={user.id}
        onUploadComplete={(data) => {
          console.log("Upload complete:", data)
        }}
      />

      {/* Import History */}
      <ImportHistory organizationId={profile.organization_id} />
    </div>
  )
}
