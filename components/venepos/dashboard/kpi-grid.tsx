import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Users, Terminal, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardMetrics } from "@/actions/dashboard"

interface KPICardProps {
  title: string
  value: string
  icon: React.ReactNode
  iconColor: string
  iconBg: string
}

interface KPIGridProps {
  metrics: DashboardMetrics
}

function KPICard({ title, value, icon, iconColor, iconBg }: KPICardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", iconBg)}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function KPIGrid({ metrics }: KPIGridProps) {
  const kpis = [
    {
      title: "Terminales Inactivos",
      value: metrics.terminalesInactivos.toLocaleString("es-VE"),
      icon: <AlertCircle className="h-6 w-6" />,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
    },
    {
      title: "Terminales Recuperados",
      value: metrics.terminalesRecuperados.toLocaleString("es-VE"),
      icon: <Terminal className="h-6 w-6" />,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      title: "Total Clientes",
      value: metrics.totalClientes.toLocaleString("es-VE"),
      icon: <Users className="h-6 w-6" />,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100",
    },
    {
      title: "Tasa de Recuperación",
      value: `${metrics.tasaRecuperacion}%`,
      icon: <TrendingUp className="h-6 w-6" />,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  )
}
