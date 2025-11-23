"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Mail, Lock, Building2, MapPin, ArrowRight, ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    rif: "",
    country: "Venezuela",
  })

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
    } else {
      // Simular registro exitoso
      console.log("Register:", formData)
      router.push("/auth/onboarding")
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Crear nueva cuenta
        </h1>
        <p className="text-slate-600">
          Prueba gratis por 14 días. Sin tarjeta de crédito.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleNext} className="space-y-5">
        {step === 1 ? (
          <>
            {/* Step 1: Personal Info */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@empresa.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <p className="text-xs text-slate-500 text-center">
              Paso 1 de 2: Datos del Administrador
            </p>
          </>
        ) : (
          <>
            {/* Step 2: Company Info */}
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Nombre de la Empresa / Organización
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Ej. Soluciones Financieras CA"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rif">RIF / NIT / ID Fiscal</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="rif"
                  type="text"
                  placeholder="J-12345678-9"
                  value={formData.rif}
                  onChange={(e) =>
                    setFormData({ ...formData, rif: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País / Región</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData({ ...formData, country: value })
                  }
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Venezuela">Venezuela</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="Peru">Perú</SelectItem>
                    <SelectItem value="Mexico">México</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                Finalizar Registro
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Paso 2 de 2: Información de la Empresa
            </p>
          </>
        )}
      </form>

      {/* Features List (Left Panel Content) */}
      {step === 1 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-indigo-600" />
            </div>
            <p className="text-sm text-slate-600">
              Automatización de mensajes por WhatsApp y SMS.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-indigo-600" />
            </div>
            <p className="text-sm text-slate-600">
              Gestión centralizada de comunicaciones.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-indigo-600" />
            </div>
            <p className="text-sm text-slate-600">
              Reportes de terminales POS Credicard en tiempo real.
            </p>
          </div>
        </div>
      )}

      {/* Login Link */}
      <p className="text-center text-sm text-slate-600 mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}
