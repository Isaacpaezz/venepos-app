"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { campaignsData } from "@/lib/data"
import { CampaignBoard } from "@/components/venepos/campaigns/campaign-board"
import { CampaignWizard } from "@/components/venepos/campaigns/campaign-wizard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"

function CampaignsContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [campaigns, setCampaigns] = useState(campaignsData)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    // Simular carga asíncrona de datos
    const timer = setTimeout(() => {
      setCampaigns(campaignsData)
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Detectar si ?new=true está presente
    setWizardOpen(searchParams.get("new") === "true")
  }, [searchParams])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Campañas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tablero de gestión de comunicaciones.
          </p>
        </div>
        <Link href="/campaigns?new=true">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Nueva Campaña
          </Button>
        </Link>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
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
      ) : (
        <CampaignBoard campaigns={campaigns} />
      )}

      {/* Campaign Wizard */}
      <CampaignWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
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
