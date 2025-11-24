import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityItem } from "@/actions/dashboard"

interface RecentActivityProps {
  activities: ActivityItem[]
}

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "import":
      return {
        icon: <Upload className="h-5 w-5" />,
        bg: "bg-blue-100",
        color: "text-blue-600",
      }
    case "alert":
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        bg: "bg-red-100",
        color: "text-red-600",
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

export function RecentActivity({ activities }: RecentActivityProps) {
  // Estado vacío
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Info className="h-12 w-12 mb-3" />
            <p className="text-sm">No hay actividad reciente</p>
            <p className="text-xs mt-1">Las importaciones aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    )
  }

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
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-400">{activity.time}</p>
                    {activity.user && (
                      <>
                        <span className="text-xs text-slate-300">•</span>
                        <p className="text-xs text-slate-400">{activity.user}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
