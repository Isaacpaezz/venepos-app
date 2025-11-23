import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { getImportHistory } from "@/actions/import"

interface ImportHistoryProps {
  organizationId: string
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("es-VE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function ImportHistory({ organizationId }: ImportHistoryProps) {
  const { success, data: imports, error } = await getImportHistory(organizationId)

  if (!success || !imports) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Historial de Cargas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-slate-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error al cargar el historial: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (imports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Historial de Cargas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No hay importaciones aún</p>
            <p className="text-sm text-slate-500 mt-1">
              Carga tu primer archivo maestro para comenzar
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Historial de Cargas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nombre de Archivo</TableHead>
                <TableHead className="text-center">Tamaño</TableHead>
                <TableHead className="text-center">Total Filas</TableHead>
                <TableHead className="text-center">Procesadas</TableHead>
                <TableHead className="text-center">Clientes</TableHead>
                <TableHead className="text-center">Terminales</TableHead>
                <TableHead className="text-center">Errores</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((record) => {
                const totalClients = (record.clients_created || 0) + (record.clients_updated || 0)
                const totalTerminals = (record.terminals_created || 0) + (record.terminals_updated || 0)
                
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-sm">
                      {formatDate(record.created_at)}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate" title={record.file_name}>
                      {record.file_name}
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-500">
                      {formatFileSize(record.file_size)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-sm font-medium">
                        {record.total_rows || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-sm text-emerald-600 font-medium">
                        {record.processed_rows || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-blue-600">{record.clients_created || 0}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="font-semibold text-amber-600">{record.clients_updated || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-blue-600">{record.terminals_created || 0}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="font-semibold text-amber-600">{record.terminals_updated || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {record.errors_count > 0 ? (
                        <span className="font-mono text-sm text-red-600 font-medium">
                          {record.errors_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.status === "completed" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border hover:bg-emerald-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completa
                        </Badge>
                      ) : record.status === "failed" ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200 border hover:bg-red-100">
                          <XCircle className="h-3 w-3 mr-1" />
                          Fallida
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 border hover:bg-blue-100">
                          <Clock className="h-3 w-3 mr-1" />
                          Procesando
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        
        {imports.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-blue-600">Nuevo</span>
                <span>/</span>
                <span className="font-semibold text-amber-600">Actualizado</span>
              </div>
            </div>
            <div>
              Mostrando {imports.length} importaciones más recientes
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
