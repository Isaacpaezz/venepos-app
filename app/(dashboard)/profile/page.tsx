"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Shield,
  Bell,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"

export default function ProfilePage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [realTimeAlerts, setRealTimeAlerts] = useState(true)
  const [theme, setTheme] = useState("system")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Mi Perfil
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona tu información personal y preferencias de cuenta.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          Guardar Cambios
        </Button>
      </div>

      {/* User Card + Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-slate-700 text-white text-2xl font-bold">
                    CR
                  </AvatarFallback>
                </Avatar>

                {/* Name + Role */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Carlos Ruiz
                  </h3>
                  <div className="flex items-center gap-2 mt-2 justify-center">
                    <Briefcase className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600">
                      Jefe de Recuperación
                    </span>
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                      ADMINISTRADOR
                    </Badge>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="w-full space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      admin@credicardpos.com
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">+58 414 1234567</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      Miembro desde Nov 2024
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="personal">
                <User className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4" />
                Seguridad
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Bell className="h-4 w-4" />
                Preferencias
              </TabsTrigger>
            </TabsList>

            {/* Tab: Personal */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre Completo</Label>
                      <Input
                        id="fullName"
                        defaultValue="Carlos Ruiz"
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Cargo / Rol</Label>
                      <Input
                        id="role"
                        defaultValue="Jefe de Recuperación"
                        placeholder="Tu cargo"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue="admin@credicardpos.com"
                        placeholder="correo@ejemplo.com"
                        disabled
                      />
                      <p className="text-xs text-slate-500">
                        El correo es gestionado por la organización.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        defaultValue="+58 414 1234567"
                        placeholder="+58 414 1234567"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Security */}
            <TabsContent value="security">
              <div className="space-y-6">
                {/* Password Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contraseña</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">
                        Contraseña Actual
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirmar Contraseña
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <Button className="bg-slate-900 hover:bg-slate-800">
                      Actualizar Contraseña
                    </Button>
                  </CardContent>
                </Card>

                {/* 2FA Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Autenticación de Dos Factores (2FA)
                      </CardTitle>
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        Desactivado
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Añade una capa extra de seguridad a tu cuenta requiriendo
                      un código temporal desde tu móvil al iniciar sesión.
                      Recomendamos usar Google Authenticator o Authy.
                    </p>
                    <Button className="bg-slate-900 hover:bg-slate-800">
                      Configurar 2FA
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Preferences */}
            <TabsContent value="preferences">
              <div className="space-y-6">
                {/* Theme Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Apariencia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setTheme("light")}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                          theme === "light"
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Sun className="h-6 w-6 text-slate-600" />
                        <span className="text-sm font-medium">Claro</span>
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                          theme === "dark"
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Moon className="h-6 w-6 text-slate-600" />
                        <span className="text-sm font-medium">Oscuro</span>
                      </button>
                      <button
                        onClick={() => setTheme("system")}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                          theme === "system"
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Monitor className="h-6 w-6 text-slate-600" />
                        <span className="text-sm font-medium">Sistema</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notificaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Resumen por Correo</p>
                        <p className="text-xs text-slate-500">
                          Recibe un resumen semanal de la actividad de tus
                          campañas.
                        </p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          Alertas en Tiempo Real
                        </p>
                        <p className="text-xs text-slate-500">
                          Notificaciones en el navegador para pagos recibidos y
                          alertas de terminales.
                        </p>
                      </div>
                      <Switch
                        checked={realTimeAlerts}
                        onCheckedChange={setRealTimeAlerts}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
