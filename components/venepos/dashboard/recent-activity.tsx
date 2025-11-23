import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  type: "payment" | "alert" | "system" | "campaign"
  title: string
  description: string
  time: string
  amount?: string
}

const activities: Activity[] = [
  {
    id: "1",
    type: "payment",
    title: "Pago Recibido",
    description: "FERRETERIA ALPECA CA liquidó saldo pendiente.",
    time: "Hace 2h",
    amount: "$1,250.00",
  },
  {
    id: "2",
    type: "campaign",
    title: "Campaña Finalizada",
    description: 'Campaña "Recuperación Zulia" completada.',
    time: "Hace 4h",
  },
  {
    id: "3",
    type: "alert",
    title: "Riesgo Detectado",
    description: "Terminal #84225844 sin transacciones > 120 días.",
    time: "Hace 6h",
  },
  {
    id: "4",
    type: "payment",
    title: "Promesa de Pago",
    description: "PISTACHOS SC CA confirmó pago para mañana.",
    time: "Hace 8h",
  },
  {
    id: "5",
    type: "system",
    title: "Actualización Sistema",
    description: "Nueva versión de WhatsApp API disponible.",
    time: "Hace 1d",
  },
]

function getActivityIcon(type: string) {
  switch (type) {
    case "payment":
      return {
        icon: <CheckCircle2 className="h-5 w-5" />,
        bg: "bg-emerald-100",
        color: "text-emerald-600",
      }
    case "alert":
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        bg: "bg-red-100",
        color: "text-red-600",
      }
    case "campaign":
      return {
        icon: <Info className="h-5 w-5" />,
        bg: "bg-blue-100",
        color: "text-blue-600",
      }
    case "system":
      return {
        icon: <Info className="h-5 w-5" />,
        bg: "bg-slate-100",
        color: "text-slate-600",
      }
    default:
      return {
        icon: <Info className="h-5 w-5" />,
        bg: "bg-slate-100",
        color: "text-slate-600",
      }
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const { icon, bg, color } = getActivityIcon(activity.type)

            return (
              <div key={activity.id} className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    bg
                  )}
                >
                  <div className={color}>{icon}</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {activity.description}
                      </p>
                    </div>
                    {activity.amount && (
                      <span className="text-sm font-bold text-emerald-600 shrink-0">
                        {activity.amount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
