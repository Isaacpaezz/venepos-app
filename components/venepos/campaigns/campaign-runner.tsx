"use client"

import { useState } from "react"
import { processOutboundBatch, ProcessBatchResult } from "@/actions/worker"
import { Button } from "@/components/ui/button"
import { Play, Square, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CampaignRunnerProps {
  campaignId: string
  onStatusChange?: (result: ProcessBatchResult) => void
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

/**
 * Motor recursivo de envío de campañas desde el cliente
 * Evita timeouts de Vercel procesando en lotes pequeños con delays
 */
export function CampaignRunner({
  campaignId,
  onStatusChange,
  variant = "ghost",
  size = "sm",
  className = "",
}: CampaignRunnerProps) {
  const [isSending, setIsSending] = useState(false)
  const [currentStats, setCurrentStats] = useState<ProcessBatchResult | null>(null)
  const { toast } = useToast()

  const startSending = async () => {
    setIsSending(true)
    let consecutiveErrors = 0
    const MAX_CONSECUTIVE_ERRORS = 3
    const BATCH_SIZE = 5
    const DELAY_BETWEEN_BATCHES = 1500 // 1.5 segundos

    try {
      while (isSending) {
        console.log(`🚀 Procesando lote de ${BATCH_SIZE} mensajes...`)

        // Procesar un lote
        const result = await processOutboundBatch(BATCH_SIZE, 1000)
        
        setCurrentStats(result)
        onStatusChange?.(result)

        // Actualizar UI con toast
        if (result.details.sent > 0) {
          toast({
            title: "✅ Mensajes enviados",
            description: `${result.details.sent} enviados. Quedan ${result.pendingCount} pendientes.`,
            duration: 2000,
          })
          consecutiveErrors = 0 // Reset contador de errores
        }

        if (result.errors > 0) {
          consecutiveErrors++
          toast({
            title: "⚠️ Errores detectados",
            description: `${result.errors} mensaje(s) fallaron. Quedan ${result.pendingCount} pendientes.`,
            variant: "destructive",
            duration: 3000,
          })
        }

        // Condiciones de parada
        if (result.pendingCount === 0) {
          console.log("✅ Campaña completada. No quedan mensajes pendientes.")
          toast({
            title: "🎉 Campaña completada",
            description: "Todos los mensajes han sido enviados.",
            duration: 5000,
          })
          setIsSending(false)
          break
        }

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error("❌ Demasiados errores consecutivos. Deteniendo envío.")
          toast({
            title: "❌ Envío detenido",
            description: `Se detectaron ${consecutiveErrors} errores consecutivos. Por favor revisa los logs.`,
            variant: "destructive",
            duration: 5000,
          })
          setIsSending(false)
          break
        }

        // Delay antes del siguiente lote
        console.log(`⏳ Esperando ${DELAY_BETWEEN_BATCHES}ms antes del siguiente lote...`)
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    } catch (error) {
      console.error("Error fatal en CampaignRunner:", error)
      toast({
        title: "❌ Error fatal",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
        duration: 5000,
      })
      setIsSending(false)
    }
  }

  const stopSending = () => {
    console.log("⏸️ Pausando envío...")
    toast({
      title: "⏸️ Envío pausado",
      description: "El envío se detendrá después del lote actual.",
      duration: 3000,
    })
    setIsSending(false)
  }

  return (
    <div className="flex items-center gap-2">
      {!isSending ? (
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={startSending}
          disabled={isSending}
        >
          <Play className="h-4 w-4" />
          {size !== "icon" && <span className="ml-1">Iniciar</span>}
        </Button>
      ) : (
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={stopSending}
        >
          {currentStats ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {size !== "icon" && (
                <span className="ml-1">
                  Enviando... ({currentStats.pendingCount} restantes)
                </span>
              )}
            </>
          ) : (
            <>
              <Square className="h-4 w-4" />
              {size !== "icon" && <span className="ml-1">Pausar</span>}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
