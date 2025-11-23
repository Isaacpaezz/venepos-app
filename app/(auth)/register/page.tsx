"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Lock, Building2, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { signupAction } from "@/actions/auth"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpiar errores anteriores
    setError(null)
    setFieldErrors({})

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Las contraseñas no coinciden" })
      toast.error("Las contraseñas no coinciden")
      return
    }

    startTransition(async () => {
      try {
        const result = await signupAction(
          formData.email,
          formData.password,
          formData.fullName,
          formData.companyName
        )

        if (result.success) {
          toast.success(result.message, {
            description: "Redirigiendo al proceso de configuración...",
          })
          // Redirigir al onboarding
          setTimeout(() => {
            router.push("/auth/onboarding")
          }, 1000)
        } else {
          // Mostrar error
          setError(result.error || result.message)
          
          if (result.field) {
            setFieldErrors({ [result.field]: result.error || result.message })
          }
          
          toast.error(result.message, {
            description: result.error,
          })
        }
      } catch (error) {
        setError("Error inesperado al crear la cuenta")
        toast.error("Error inesperado", {
          description: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    })
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Crear nueva cuenta
        </h1>
        <p className="text-slate-600">
          Comienza gratis. Crea tu cuenta en menos de un minuto.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-5">
        {/* Nombre Completo */}
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
              className={`pl-10 ${fieldErrors.fullName ? "border-red-500" : ""}`}
              disabled={isPending}
              required
            />
            {fieldErrors.fullName && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.fullName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
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
              className={`pl-10 ${fieldErrors.email ? "border-red-500" : ""}`}
              disabled={isPending}
              required
            />
            {fieldErrors.email && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
            )}
          </div>
        </div>

        {/* Nombre de la Empresa */}
        <div className="space-y-2">
          <Label htmlFor="companyName">Nombre de la Empresa</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="companyName"
              type="text"
              placeholder="Mi Empresa"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              className={`pl-10 ${fieldErrors.organizationName ? "border-red-500" : ""}`}
              disabled={isPending}
              required
            />
            {fieldErrors.organizationName && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.organizationName}</p>
            )}
          </div>
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className={`pl-10 ${fieldErrors.password ? "border-red-500" : ""}`}
              disabled={isPending}
              required
              minLength={6}
            />
            {fieldErrors.password && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Usa una combinación de letras, números y símbolos.
          </p>
        </div>

        {/* Confirmar Contraseña */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className={`pl-10 ${fieldErrors.confirmPassword ? "border-red-500" : ""}`}
              disabled={isPending}
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          size="lg"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            <>
              Crear Cuenta
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-slate-600 mt-6">
        ¿Ya tienes una cuenta?{" "}
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
