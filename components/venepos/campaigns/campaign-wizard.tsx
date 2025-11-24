"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createCampaign, estimateAudience } from "@/actions/campaigns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  MessageSquare,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Users,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CampaignWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
}

export function CampaignWizard({ open, onOpenChange, organizationId }: CampaignWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [estimatedAudience, setEstimatedAudience] = useState(0)
  const [formData, setFormData] = useState({
    nombre: "",
    canal: "",
    banco: "Todos los Bancos",
    rangoTX: "30 DIAS SIN TX",
    mensaje: "",
  })

  const handleClose = () => {
    onOpenChange(false)
    router.push("/campaigns")
    // Reset form
    setTimeout(() => {
      setCurrentStep(1)
      setFormData({
        nombre: "",
        canal: "",
        banco: "Todos los Bancos",
        rangoTX: "30 DIAS SIN TX",
        mensaje: "",
      })
    }, 300)
  }

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      // Lanzar campaña
      await handleCreateCampaign()
    }
  }

  const handleCreateCampaign = async () => {
    setIsCreating(true)

    try {
      const result = await createCampaign({
        name: formData.nombre,
        channel: formData.canal as "whatsapp" | "sms",
        filters: {
          banco: formData.banco,
          rangoTX: formData.rangoTX,
        },
        messageTemplate: formData.mensaje,
        organizationId,
      })

      if (result.success) {
        toast.success(
          `Campaña creada con ${result.messagesEnqueued} mensajes en cola`,
          {
            description: "La campaña está lista para ser enviada",
          }
        )
        handleClose()
        router.refresh()
      } else {
        toast.error("Error al crear campaña", {
          description: result.error || "Intenta nuevamente",
        })
      }
    } catch (error) {
      console.error("Error creando campaña:", error)
      toast.error("Error inesperado", {
        description: "No se pudo crear la campaña",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      mensaje: formData.mensaje + `{{${variable}}}`,
    })
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Configuración de Campaña"
      case 2:
        return "Definir Audiencia"
      case 3:
        return "Diseñar Mensaje"
      case 4:
        return "Revisar y Lanzar"
      default:
        return ""
    }
  }

  // Calcular audiencia estimada cuando cambien los filtros
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!organizationId) return
      
      const count = await estimateAudience(
        {
          banco: formData.banco,
          rangoTX: formData.rangoTX,
        },
        organizationId
      )
      setEstimatedAudience(count)
    }

    fetchEstimate()
  }, [formData.banco, formData.rangoTX, organizationId])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-2xl p-0 gap-0",
          currentStep === 3 && "max-w-4xl"
        )}
      >
        {/* Header con indicador de paso */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white text-sm font-bold">
              {currentStep}
            </div>
            <DialogTitle className="text-lg font-bold">
              {getStepTitle()}
            </DialogTitle>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  step <= currentStep ? "bg-indigo-600" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6">
          {/* Paso 1: Configuración */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Nombre de la Campaña */}
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Campaña</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Recuperación Q3 - Inactivos"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>

              {/* Canal de Envío */}
              <div className="space-y-3">
                <Label>Canal de Envío</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* WhatsApp API */}
                  <Card
                    className={cn(
                      "p-6 cursor-pointer transition-all hover:shadow-md border-2",
                      formData.canal === "whatsapp"
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-slate-200"
                    )}
                    onClick={() =>
                      setFormData({ ...formData, canal: "whatsapp" })
                    }
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center",
                          formData.canal === "whatsapp"
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">WhatsApp API</p>
                      </div>
                    </div>
                  </Card>

                  {/* SMS */}
                  <Card
                    className={cn(
                      "p-6 cursor-pointer transition-all hover:shadow-md border-2",
                      formData.canal === "sms"
                        ? "border-indigo-500 bg-indigo-50/50"
                        : "border-slate-200"
                    )}
                    onClick={() => setFormData({ ...formData, canal: "sms" })}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center",
                          formData.canal === "sms"
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">SMS</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Audiencia */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-blue-900">
                      Filtrado de Audiencia
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Configura los criterios para seleccionar a los clientes
                      inactivos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-2 gap-4">
                {/* Banco Afiliado */}
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco Afiliado</Label>
                  <Select
                    value={formData.banco}
                    onValueChange={(value) =>
                      setFormData({ ...formData, banco: value })
                    }
                  >
                    <SelectTrigger id="banco" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos los Bancos">
                        Todos los Bancos
                      </SelectItem>
                      <SelectItem value="Banesco">Banesco</SelectItem>
                      <SelectItem value="Mercantil">Mercantil</SelectItem>
                      <SelectItem value="BOD">BOD</SelectItem>
                      <SelectItem value="Provincial">Provincial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rango Transaccional */}
                <div className="space-y-2">
                  <Label htmlFor="rangoTX">
                    Rango Transaccional (Rango TX)
                  </Label>
                  <Select
                    value={formData.rangoTX}
                    onValueChange={(value) =>
                      setFormData({ ...formData, rangoTX: value })
                    }
                  >
                    <SelectTrigger id="rangoTX" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30 DIAS SIN TX">
                        30 DÍAS SIN TX
                      </SelectItem>
                      <SelectItem value="60 DIAS SIN TX">
                        60 DÍAS SIN TX
                      </SelectItem>
                      <SelectItem value="90 DIAS SIN TX">
                        90 DÍAS SIN TX
                      </SelectItem>
                      <SelectItem value="120 DIAS SIN TX">
                        120 DÍAS SIN TX
                      </SelectItem>
                      <SelectItem value="SIN TX EN EL MES ACTUAL">
                        SIN TX EN EL MES ACTUAL
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Audiencia Estimada */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">
                      Audiencia Estimada
                    </span>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-sm px-3 py-1">
                    {estimatedAudience} clientes
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Mensaje */}
          {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-6">
              {/* Izquierda: Editor */}
              <div className="space-y-4">
                {/* Variables Dinámicas */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">
                    Variables Dinámicas
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("nombre")}
                      className="text-xs"
                    >
                      {"{"}
                      {"{"}nombre{"}"}
                      {"}"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("rif")}
                      className="text-xs"
                    >
                      {"{"}
                      {"{"}rif{"}"}
                      {"}"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("telefono")}
                      className="text-xs"
                    >
                      {"{"}
                      {"{"}telefono{"}"}
                      {"}"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("dias_inactivo")}
                      className="text-xs"
                    >
                      {"{"}
                      {"{"}dias_inactivo{"}"}
                      {"}"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("rango_lcsttxt")}
                      className="text-xs"
                    >
                      {"{"}
                      {"{"}rango_lcsttxt{"}"}
                      {"}"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable("afipos")}
                      className="text-xs"
                    >
                      {"{"}
                      {"{"}afipos{"}"}
                      {"}"}
                    </Button>
                  </div>
                </div>

                {/* Plantilla del Mensaje */}
                <div className="space-y-2">
                  <Label htmlFor="mensaje" className="text-xs font-semibold text-slate-500 uppercase">
                    Plantilla del Mensaje
                  </Label>
                  <Textarea
                    id="mensaje"
                    placeholder="Escribe tu mensaje aquí..."
                    value={formData.mensaje}
                    onChange={(e) =>
                      setFormData({ ...formData, mensaje: e.target.value })
                    }
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Derecha: Preview */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">
                  Vista Previa
                </Label>
                {/* Mockup de celular */}
                <div className="relative mx-auto w-[280px]">
                  <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
                    <div className="bg-white rounded-4xl overflow-hidden h-[500px]">
                      {/* Header del chat */}
                      <div className="bg-emerald-600 p-3 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-white/20" />
                        <div className="flex-1">
                          <p className="text-white text-xs font-semibold">
                            CREDICARDPOS
                          </p>
                        </div>
                      </div>

                      {/* Mensaje */}
                      <div className="p-4 bg-slate-50 h-full overflow-y-auto">
                        <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[220px]">
                          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {formData.mensaje ||
                              "Tu mensaje aparecerá aquí..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Revisar */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-emerald-900 mb-2">
                  ¡Todo listo!
                </h3>
                <p className="text-sm text-emerald-700">
                  Tu campaña está configurada y lista para ser lanzada.
                </p>
              </div>

              {/* Resumen */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-slate-600">Nombre</span>
                  <span className="text-sm font-semibold">
                    {formData.nombre || "Sin nombre"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-slate-600">Canal</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    {formData.canal === "whatsapp" ? "WhatsApp" : "SMS"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-slate-600">Audiencia</span>
                  <span className="text-sm font-semibold">
                    {estimatedAudience} clientes
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-slate-600">Filtros</span>
                  <span className="text-sm font-semibold">
                    {formData.banco} • {formData.rangoTX}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-slate-50">
          <div>
            {currentStep > 1 && (
              <Button variant="ghost" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>
          <Button
            onClick={handleNext}
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={
              isCreating ||
              (currentStep === 1 && (!formData.nombre || !formData.canal)) ||
              (currentStep === 3 && !formData.mensaje)
            }
          >
            {isCreating
              ? "Creando audiencia..."
              : currentStep === 4
              ? "Lanzar Campaña"
              : "Siguiente"}
            {currentStep < 4 && !isCreating && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
