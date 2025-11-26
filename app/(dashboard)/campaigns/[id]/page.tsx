import { getCampaignAnalytics } from "@/actions/campaign-analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Send,
  MessageCircle,
  CheckCircle2,
  Check,
  Clock,
  X,
} from "lucide-react"
import { redirect } from "next/navigation"
import { CampaignDetailHeader } from "@/components/venepos/campaigns/campaign-detail-header"

// =====================================================
// PÁGINA DE DETALLE DE CAMPAÑA
// =====================================================

interface CampaignDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  // Await params (Next.js 14+)
  const { id } = await params
  
  // Obtener analytics de la campaña
  const analytics = await getCampaignAnalytics(id)

  // Manejar caso de error
  if (!analytics) {
    redirect("/campaigns")
  }

  const { campaign, kpis, details } = analytics

  // Verificar si hay mensajes pendientes
  const hasPendingMessages = kpis.audience > kpis.sent

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* ==========================================
          A. HEADER
          ========================================== */}
      <CampaignDetailHeader
        campaignId={campaign.id}
        campaignName={campaign.nombre}
        status={campaign.status}
        createdAt={campaign.created_at}
        hasPendingMessages={hasPendingMessages}
      />

      {/* ==========================================
          B. GRID DE KPIs (4 TARJETAS)
          ========================================== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tarjeta 1: Audiencia */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Audiencia
            </CardTitle>
            <Users className="h-5 w-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {kpis.audience}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total de destinatarios
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Enviados */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Enviados
            </CardTitle>
            <Send className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{kpis.sent}</div>
            <p className="text-xs text-slate-500 mt-1">
              Mensajes enviados exitosamente
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 3: Respuestas */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Respuestas
            </CardTitle>
            <MessageCircle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {kpis.replied}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Clientes que respondieron
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 4: Recuperados */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Recuperados
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {kpis.recovered}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Terminales recuperados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ==========================================
          C. TABLA DE DESTINATARIOS
          ========================================== */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Detalle de Envíos
        </h2>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado Envío</TableHead>
                  <TableHead>Respuesta</TableHead>
                  <TableHead>Estado Terminal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-slate-500"
                    >
                      No hay destinatarios en esta campaña
                    </TableCell>
                  </TableRow>
                ) : (
                  details.map((detail) => (
                    <TableRow key={detail.queue_id}>
                      {/* Cliente */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {detail.client_name}
                          </span>
                          {detail.rango_deuda && (
                            <span className="text-xs text-slate-500">
                              {detail.rango_deuda}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Teléfono */}
                      <TableCell className="text-slate-600">
                        {detail.phone}
                      </TableCell>

                      {/* Estado Envío */}
                      <TableCell>
                        {detail.sent_status === "sent" && (
                          <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <Check className="h-3 w-3" />
                            Enviado
                          </Badge>
                        )}
                        {detail.sent_status === "pending" && (
                          <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                        {detail.sent_status === "failed" && (
                          <Badge className="gap-1 bg-red-100 text-red-700 hover:bg-red-100">
                            <X className="h-3 w-3" />
                            Fallido
                          </Badge>
                        )}
                      </TableCell>

                      {/* Respuesta */}
                      <TableCell>
                        {detail.has_replied ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            Respondió
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Estado Terminal */}
                      <TableCell>
                        {detail.terminal_status === "recovered" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            RECUPERADO
                          </Badge>
                        ) : detail.terminal_afipos ? (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                            {detail.terminal_status || "Inactivo"}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
