import { Suspense } from "react"
import { CampaignsWrapper } from "@/components/venepos/campaigns/campaigns-wrapper"
import { getCampaigns } from "@/actions/campaigns"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

async function CampaignsContent() {
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

  // Obtener campañas
  const campaigns = await getCampaigns(profile.organization_id)

  return (
    <CampaignsWrapper 
      campaigns={campaigns} 
      organizationId={profile.organization_id}
    />
  )
}

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-9 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-32" />
                <div className="bg-slate-50 rounded-xl p-3 border space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <CampaignsContent />
    </Suspense>
  )
}
