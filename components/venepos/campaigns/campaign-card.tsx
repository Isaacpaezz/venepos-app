import { CampaignWithStats } from "@/actions/campaigns"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mail, MessageSquare, Phone, Calendar, Users, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

interface CampaignCardProps {
  campaign: CampaignWithStats
}

function getChannelIcon(channel: string) {
  switch (channel.toLowerCase()) {
    case "email":
      return <Mail className="h-3.5 w-3.5" />
    case "sms":
      return <MessageSquare className="h-3.5 w-3.5" />
    case "whatsapp":
      return <MessageSquare className="h-3.5 w-3.5" />
    case "call":
      return <Phone className="h-3.5 w-3.5" />
    case "push":
      return <Megaphone className="h-3.5 w-3.5" />
    case "banner":
      return <Megaphone className="h-3.5 w-3.5" />
    default:
      return <Mail className="h-3.5 w-3.5" />
  }
}

function getChannelColor(channel: string) {
  switch (channel.toLowerCase()) {
    case "email":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "sms":
      return "bg-purple-100 text-purple-700 border-purple-200"
    case "whatsapp":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "call":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "push":
      return "bg-indigo-100 text-indigo-700 border-indigo-200"
    case "banner":
      return "bg-amber-100 text-amber-700 border-amber-200"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

function getBorderColor(status: string) {
  switch (status) {
    case "draft":
      return "border-l-slate-300"
    case "scheduled":
      return "border-l-amber-400"
    case "processing":
    case "sending":
      return "border-l-blue-500"
    case "completed":
      return "border-l-emerald-500"
    case "paused":
      return "border-l-orange-400"
    case "failed":
      return "border-l-red-400"
    default:
      return "border-l-slate-300"
  }
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Card
      className={cn(
        "p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4",
        getBorderColor(campaign.status)
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
          {campaign.nombre}
        </h3>
        <Badge
          variant="secondary"
          className={cn(
            "text-[10px] px-2 py-0.5 border shrink-0",
            getChannelColor(campaign.tipo)
          )}
        >
          <span className="flex items-center gap-1">
            {getChannelIcon(campaign.tipo)}
            {campaign.tipo.toUpperCase()}
          </span>
        </Badge>
      </div>

      {/* Fecha */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          {new Date(campaign.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        {campaign.status === "sending" && campaign.started_at && (
          <span className="text-slate-400">
            , {new Date(campaign.started_at).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Audiencia */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
        <Users className="h-3.5 w-3.5" />
        <span className="font-medium">
          {campaign.total_destinatarios.toLocaleString()} clientes
        </span>
      </div>

      {/* Progress bar para campañas en envío o processing */}
      {(campaign.status === "sending" || campaign.status === "processing") && (
        <div className="space-y-1.5">
          <Progress value={campaign.progreso} className="h-2" />
          <p className="text-xs text-slate-500 text-right">
            {campaign.progreso}% completado
          </p>
        </div>
      )}

      {/* Estadísticas para campañas completadas */}
      {campaign.status === "completed" && (
        <div className="grid grid-cols-2 gap-2 pt-3 border-t">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
              Enviados
            </p>
            <p className="text-sm font-bold text-slate-900">
              {campaign.enviados.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
              Entregados
            </p>
            <p className="text-sm font-bold text-emerald-600">
              {campaign.entregados.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
