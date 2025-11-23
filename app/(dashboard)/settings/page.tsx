"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatwootForm } from "@/components/venepos/settings/chatwoot-form"
import { TeamList } from "@/components/venepos/settings/team-list"
import { Building2, Users, Plug, CreditCard } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Configuración de Organización
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Administra tu empresa, equipo y conexiones externas.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4" />
            Integraciones
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4" />
            Facturación
          </TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general">
          <div className="space-y-6">
            {/* Company Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Perfil de la Empresa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nombre de la Organización
                  </label>
                  <input
                    type="text"
                    defaultValue="VenePOS Inc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    ID Fiscal (RIF/NIT)
                  </label>
                  <input
                    type="text"
                    defaultValue="J-12345678-9"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    defaultValue="Av. Principal de Las Mercedes, Torre Financiera, Piso 5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    País
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Venezuela</option>
                    <option>Colombia</option>
                    <option>Perú</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Zona Horaria
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Caracas (GMT-4)</option>
                    <option>Bogotá (GMT-5)</option>
                    <option>Lima (GMT-5)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Team */}
        <TabsContent value="team">
          <TeamList />
        </TabsContent>

        {/* Tab: Integrations */}
        <TabsContent value="integrations">
          <ChatwootForm />
        </TabsContent>

        {/* Tab: Billing */}
        <TabsContent value="billing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Actual */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Plan Actual</h3>
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">Plan Pro</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    ACTIVO
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  Facturación mensual • Próximo cobro: 01 Dic 2025
                </p>
                <div className="pt-4 border-t space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Usuarios Activos
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full w-[30%]" />
                      </div>
                      <span className="text-sm font-medium">3 / 10</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Contactos Sincronizados
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full w-[25%]" />
                      </div>
                      <span className="text-sm font-medium">1,284 / 5,000</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <button className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50">
                    Historial de Facturas
                  </button>
                  <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                    Cambiar Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Método de Pago</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg">
                  <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      Visa terminada en 4242
                    </p>
                    <p className="text-xs text-slate-500">Expira 12/28</p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50">
                  Actualizar Tarjeta
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
