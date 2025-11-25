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
            Riesgo de Cartera por Rango
          </CardTitle>
          <p className="text-sm text-slate-500">
            Distribución de terminales según días sin transacciones.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[350px] text-slate-400">
            <p className="text-sm">No hay datos disponibles</p>
            <p className="text-xs mt-1">Importa un archivo maestro para ver el gráfico</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Riesgo de Cartera por Rango
        </CardTitle>
        <p className="text-sm text-slate-500">
          Distribución de terminales según días sin transacciones.
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
                `${value.toLocaleString("es-VE")} terminales`,
                "",
              ]}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Leyenda personalizada */}
        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600">
                {item.name}: <span className="font-semibold">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
