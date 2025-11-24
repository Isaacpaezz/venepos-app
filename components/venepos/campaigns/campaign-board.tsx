import { CampaignWithStats } from "@/actions/campaigns"
import { CampaignCard } from "./campaign-card"
import { FileText, Clock, Send, CheckCircle2 } from "lucide-react"

interface CampaignBoardProps {
  campaigns: CampaignWithStats[]
}

const columns = [
  {
    id: "draft",
    title: "Borrador",
    icon: FileText,
    bgColor: "bg-slate-50/50",
    iconColor: "text-slate-500",
  },
  {
    id: "scheduled",
    title: "Programadas",
    icon: Clock,
    bgColor: "bg-amber-50/50",
    iconColor: "text-amber-500",
  },
  {
    id: "sending",
    title: "Enviando",
    icon: Send,
    bgColor: "bg-blue-50/50",
    iconColor: "text-blue-500",
  },
  {
    id: "completed",
    title: "Completadas",
    icon: CheckCircle2,
    bgColor: "bg-emerald-50/50",
    iconColor: "text-emerald-500",
  },
]

export function CampaignBoard({ campaigns }: CampaignBoardProps) {
  const getCampaignsByStatus = (status: string) => {
    return campaigns.filter((campaign) => campaign.status === status)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnCampaigns = getCampaignsByStatus(column.id)
        const Icon = column.icon

        return (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${column.iconColor}`} />
                <h3 className="font-semibold text-sm text-slate-700">
                  {column.title}
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {columnCampaigns.length}
              </span>
            </div>

            {/* Column Content */}
            <div
              className={`flex-1 ${column.bgColor} rounded-xl p-3 border border-slate-100 min-h-[200px]`}
            >
              <div className="space-y-3">
                {columnCampaigns.length > 0 ? (
                  columnCampaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-400">
                    <p className="text-sm">Sin campañas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
