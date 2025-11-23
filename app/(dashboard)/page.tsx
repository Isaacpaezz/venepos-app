"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import { KPIGrid } from "@/components/venepos/dashboard/kpi-grid"
import { RecoveryChart } from "@/components/venepos/dashboard/recovery-chart"
import { RecentActivity } from "@/components/venepos/dashboard/recent-activity"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Buenos días, Carlos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sábado, 22 De Noviembre De 2025
          </p>
        </div>
        <Link href="/campaigns?new=true">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Nueva Campaña
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <KPIGrid />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - 2 columns */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-[450px] w-full" />
          ) : (
            <RecoveryChart />
          )}
        </div>

        {/* Recent Activity - 1 column */}
        <div className="lg:col-span-1">
          {isLoading ? (
            <Skeleton className="h-[450px] w-full" />
          ) : (
            <RecentActivity />
          )}
        </div>
      </div>
    </div>
  )
}
