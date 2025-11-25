import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCampaignDetail } from "@/actions/campaign-detail"
import { ArrowLeft, Calendar, CheckCircle2, Clock, Users, TrendingUp, MessageCircle, Target } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Obtener usuario y organización
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (!profile?.organization_id) {
    redirect("/onboarding")
  }

  // Obtener detalle de la campaña
  const campaignData = await getCampaignDetail(id, profile.organization_id)

  if (!campaignData) {
    notFound()
  }

  // Función helper para formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Intl.DateTimeFormat("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  // Función para badge de estado
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Borrador", variant: "secondary" },
      sending: { label: "Enviando", variant: "default" },
      completed: { label: "Completada", variant: "outline" },
    }

    const config = variants[status] || { label: status, variant: "outline" }
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  // Función para badge de estatus terminal
  const getTerminalStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: "Activo", className: "bg-emerald-100 text-emerald-700" },
      inactive: { label: "Inactivo", className: "bg-slate-100 text-slate-700" },
      recovered: { label: "Recuperado", className: "bg-blue-100 text-blue-700" },
      churned: { label: "Churned", className: "bg-red-100 text-red-700" },
    }

    const badgeConfig = config[status] || config.inactive
    return (
      <Badge className={`text-xs ${badgeConfig.className}`}>
        {badgeConfig.label}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Campañas
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {campaignData.nombre}
            </h1>
            {campaignData.descripcion && (
              <p className="text-slate-600 mt-2">{campaignData.descripcion}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              {getStatusBadge(campaignData.status)}
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                {formatDate(campaignData.createdAt)}
              </span>
              {campaignData.completedAt && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Completada: {formatDate(campaignData.completedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Audiencia Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {campaignData.metrics.audienciaTotal}
            </div>
            <p className="text-xs text-slate-500 mt-1">Clientes en la campaña</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {campaignData.metrics.enviados}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {campaignData.metrics.audienciaTotal > 0
                ? `${Math.round((campaignData.metrics.enviados / campaignData.metrics.audienciaTotal) * 100)}% del total`
                : "0% del total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Respondidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {campaignData.metrics.respondidos}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {campaignData.metrics.enviados > 0
                ? `${Math.round((campaignData.metrics.respondidos / campaignData.metrics.enviados) * 100)}% tasa de respuesta`
                : "0% tasa de respuesta"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recuperados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {campaignData.metrics.recuperados}
            </div>
            <p className="text-xs text-slate-500 mt-1">Terminales recuperados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tasa de Éxito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">
              {campaignData.metrics.tasaExito}%
            </div>
            <p className="text-xs text-emerald-700 mt-1">Recuperados / Enviados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Detalle de Clientes</CardTitle>
          <p className="text-sm text-slate-500">
            Lista completa de clientes en esta campaña con su estado de interacción
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Teléfono</TableHead>
                  <TableHead className="font-semibold text-center">Estado Envío</TableHead>
                  <TableHead className="font-semibold text-center">¿Respondió?</TableHead>
                  <TableHead className="font-semibold text-center">Estatus Terminal</TableHead>
                  <TableHead className="font-semibold text-center"># Terminales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignData.clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No hay clientes en esta campaña
                    </TableCell>
                  </TableRow>
                ) : (
                  campaignData.clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{client.nombre}</p>
                          <p className="text-xs text-slate-500">{client.rif}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {client.telefono}
                      </TableCell>
                      <TableCell className="text-center">
                        {client.estadoEnvio === "sent" && (
                          <div className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">Enviado</span>
                          </div>
                        )}
                        {client.estadoEnvio === "pending" && (
                          <div className="inline-flex items-center gap-1 text-amber-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">Pendiente</span>
                          </div>
                        )}
                        {client.estadoEnvio === "failed" && (
                          <div className="inline-flex items-center gap-1 text-red-600">
                            <span className="text-xs">Fallido</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={client.respondio ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {client.respondio ? "Sí" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getTerminalStatusBadge(client.estatusTerminal)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-slate-700">
                          {client.terminalesCount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
