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
import { CheckCircle2, XCircle } from "lucide-react"

interface ImportRecord {
  id: string
  fecha: string
  nombreArchivo: string
  registrosNuevos: number
  registrosActualizados: number
  estado: "exitoso" | "fallido"
  usuario: string
}

const mockImports: ImportRecord[] = [
  {
    id: "1",
    fecha: "2025-11-22 14:30",
    nombreArchivo: "clientes_noviembre_2025.xlsx",
    registrosNuevos: 145,
    registrosActualizados: 89,
    estado: "exitoso",
    usuario: "Carlos Ruiz",
  },
  {
    id: "2",
    fecha: "2025-11-21 09:15",
    nombreArchivo: "actualizacion_terminales.csv",
    registrosNuevos: 0,
    registrosActualizados: 234,
    estado: "exitoso",
    usuario: "Carlos Ruiz",
  },
  {
    id: "3",
    fecha: "2025-11-20 16:45",
    nombreArchivo: "maestro_clientes_Q4.xlsx",
    registrosNuevos: 312,
    registrosActualizados: 156,
    estado: "exitoso",
    usuario: "Admin",
  },
  {
    id: "4",
    fecha: "2025-11-19 11:20",
    nombreArchivo: "import_fallido.csv",
    registrosNuevos: 0,
    registrosActualizados: 0,
    estado: "fallido",
    usuario: "Carlos Ruiz",
  },
  {
    id: "5",
    fecha: "2025-11-18 08:00",
    nombreArchivo: "clientes_octubre.xlsx",
    registrosNuevos: 98,
    registrosActualizados: 45,
    estado: "exitoso",
    usuario: "Admin",
  },
]

export function ImportHistory() {
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
                <TableHead className="text-center">Registros Nuevos</TableHead>
                <TableHead className="text-center">
                  Registros Actualizados
                </TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead>Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockImports.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium text-sm">
                    {record.fecha}
                  </TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate">
                    {record.nombreArchivo}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-sm">
                      {record.registrosNuevos}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-sm">
                      {record.registrosActualizados}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {record.estado === "exitoso" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border hover:bg-emerald-100">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Exitoso
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-red-200 border hover:bg-red-100">
                        <XCircle className="h-3 w-3 mr-1" />
                        Fallido
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {record.usuario}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
