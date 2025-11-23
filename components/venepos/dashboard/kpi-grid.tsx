import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertCircle, Activity, DollarSign, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string
  trend: string
  trendUp: boolean
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  isNegativeTrend?: boolean // Si true, tendencia al alza es mala (rojo)
}

function KPICard({ title, value, trend, trendUp, icon, iconColor, iconBg, isNegativeTrend }: KPICardProps) {
  const trendColor = isNegativeTrend
    ? trendUp
      ? "text-red-600"
      : "text-emerald-600"
    : trendUp
    ? "text-emerald-600"
    : "text-red-600"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", iconBg)}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
            {trendUp ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{trend}</span>
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

export function KPIGrid() {
  const kpis = [
    {
      title: "Terminales Recuperados",
      value: "1,284",
      trend: "+12.5%",
      trendUp: true,
      icon: <Terminal className="h-6 w-6" />,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      isNegativeTrend: false,
    },
    {
      title: "Terminales Inactivos",
      value: "324",
      trend: "+5.4%",
      trendUp: true,
      icon: <AlertCircle className="h-6 w-6" />,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
      isNegativeTrend: true, // Tendencia al alza es mala
    },
    {
      title: "Recuperación Mensual",
      value: "$452,000",
      trend: "+8.2%",
      trendUp: true,
      icon: <DollarSign className="h-6 w-6" />,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100",
      isNegativeTrend: false,
    },
    {
      title: "Tasa de Éxito",
      value: "94.2%",
      trend: "-1.1%",
      trendUp: false,
      icon: <Activity className="h-6 w-6" />,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
      isNegativeTrend: false,
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
