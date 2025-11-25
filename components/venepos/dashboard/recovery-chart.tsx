"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { ChartDataPoint } from "@/actions/dashboard"

interface RecoveryChartProps {
  data: ChartDataPoint[]
}

export function RecoveryChart({ data }: RecoveryChartProps) {
  // Estado vacío
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Embudo de Conversión Global
          </CardTitle>
          <p className="text-sm text-slate-500">
            Seguimiento del proceso de recuperación de terminales.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[350px] text-slate-400">
            <p className="text-sm">No hay datos disponibles</p>
            <p className="text-xs mt-1">Ejecuta campañas para ver el embudo de conversión</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular porcentajes para mostrar tasas de conversión
  const contactados = data[0]?.value || 0
  const respondieron = data[1]?.value || 0
  const recuperados = data[2]?.value || 0

  const tasaRespuesta = contactados > 0 ? Math.round((respondieron / contactados) * 100) : 0
  const tasaRecuperacion = contactados > 0 ? Math.round((recuperados / contactados) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Embudo de Conversión Global
        </CardTitle>
        <p className="text-sm text-slate-500">
          Seguimiento del proceso de recuperación de terminales.
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString("es-VE")}
            />
            <Tooltip
              cursor={{ fill: "rgba(226, 232, 240, 0.2)" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              formatter={(value: number) => [
                `${value.toLocaleString("es-VE")} clientes`,
                "",
              ]}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={100}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Métricas de conversión */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-sm text-slate-600">Tasa de Respuesta</p>
            <p className="text-2xl font-bold text-amber-600">{tasaRespuesta}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {respondieron} de {contactados} respondieron
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600">Tasa de Recuperación</p>
            <p className="text-2xl font-bold text-emerald-600">{tasaRecuperacion}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {recuperados} de {contactados} recuperados
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
