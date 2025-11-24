"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CampaignWithStats } from "@/actions/campaigns"
import { CampaignBoard } from "./campaign-board"
import { CampaignWizard } from "./campaign-wizard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CampaignsWrapperProps {
  campaigns: CampaignWithStats[]
  organizationId: string
}

export function CampaignsWrapper({ campaigns, organizationId }: CampaignsWrapperProps) {
  const searchParams = useSearchParams()
  const [wizardOpen, setWizardOpen] = useState(false)

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
      <CampaignBoard campaigns={campaigns} />

      {/* Campaign Wizard */}
      <CampaignWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen}
        organizationId={organizationId}
      />
    </div>
  )
}
