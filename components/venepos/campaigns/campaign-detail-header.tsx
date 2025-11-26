"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CampaignRunner } from "./campaign-runner"
import { useRouter } from "next/navigation"

interface CampaignDetailHeaderProps {
  campaignId: string
  campaignName: string
  status: string
  createdAt: string
  hasPendingMessages: boolean
}

export function CampaignDetailHeader({
  campaignId,
  campaignName,
  status,
  createdAt,
  hasPendingMessages,
}: CampaignDetailHeaderProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Completada
          </Badge>
        )
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            En Proceso
          </Badge>
        )
      case "draft":
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
            Borrador
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Cancelada
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Botón Volver */}
      <Link href="/campaigns">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </Link>

      {/* Título, Badge y CampaignRunner */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">{campaignName}</h1>
          <p className="text-sm text-slate-500">
            Creada el {formatDate(createdAt)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* CampaignRunner para reanudar envíos */}
          {(status === "processing" || status === "draft") && hasPendingMessages && (
            <CampaignRunner
              campaignId={campaignId}
              onStatusChange={() => router.refresh()}
              variant="default"
              size="default"
            />
          )}
          {getStatusBadge(status)}
        </div>
      </div>
    </div>
  )
}
