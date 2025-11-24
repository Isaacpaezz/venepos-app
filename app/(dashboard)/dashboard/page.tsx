import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { KPIGrid } from "@/components/venepos/dashboard/kpi-grid"
import { RecoveryChart } from "@/components/venepos/dashboard/recovery-chart"
import { RecentActivity } from "@/components/venepos/dashboard/recent-activity"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  getDashboardMetrics,
  getChartData,
  getRecentActivity,
} from "@/actions/dashboard"

export default async function DashboardPage() {
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
    .select("organization_id, full_name")
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

  // Fetch datos en paralelo
  const [metrics, chartData, activities] = await Promise.all([
    getDashboardMetrics(profile.organization_id),
    getChartData(profile.organization_id),
    getRecentActivity(profile.organization_id),
  ])

  // Formatear fecha
  const now = new Date()
  const dateString = new Intl.DateTimeFormat("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now)

  // Capitalizar primera letra
  const formattedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1)

  // Obtener saludo según hora
  const hour = now.getHours()
  let greeting = "Buenos días"
  if (hour >= 12 && hour < 18) {
    greeting = "Buenas tardes"
  } else if (hour >= 18) {
    greeting = "Buenas noches"
  }

  const firstName = profile.full_name?.split(" ")[0] || "Usuario"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {greeting}, {firstName}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{formattedDate}</p>
        </div>
        <Link href="/campaigns?new=true">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Nueva Campaña
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <KPIGrid metrics={metrics} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - 2 columns */}
        <div className="lg:col-span-2">
          <RecoveryChart data={chartData} />
        </div>

        {/* Recent Activity - 1 column */}
        <div className="lg:col-span-1">
          <RecentActivity activities={activities} />
        </div>
      </div>
    </div>
  )
}
