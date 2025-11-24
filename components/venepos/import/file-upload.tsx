"use client"

import { useState, useCallback, useTransition } from "react"
import * as XLSX from "xlsx"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  processBatchImport, 
  detectSystemRecoveries, 
  createImportRecord, 
  updateImportRecord 
} from "@/actions/import"
import { toast } from "sonner"

type UploadState = "idle" | "dragging" | "uploading" | "complete" | "error"

interface FileUploadProps {
  organizationId: string
  userId: string
  onUploadComplete?: (data: { fileName: string; recordCount: number }) => void
}

interface ExcelRow {
  // Campos de Cliente
  CODIGO_AFILIADO: string
  NOMBRE_AFILIADO: string
  RIF_AFILIADO: string
  TELEFONO_AFILIADO: string
  PERSONA_CONTACTO: string
  DIRECCION_AFILIADO: string
  NOMBRE_BANCO: string
  CATEGORIA_COMERCIO: string
  // Ubicación
  REGION: string
  ESTADO: string
  CIUDAD: string
  SECTOR: string
  // Campos de Terminal
  AFIPOS: string
  NUMPOS: string
  RANGO: string
  // Datos Técnicos
  MARCA: string
  MODELO: string
  SERIAL: string
  OPERADORA: string
  ESTADO_POSV2: string
}

const BATCH_SIZE = 100 // Procesar 100 filas por lote

export function FileUpload({ organizationId, userId, onUploadComplete }: FileUploadProps) {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<UploadState>("idle")
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState("")
  const [recordCount, setRecordCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [processingStatus, setProcessingStatus] = useState("")

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState("dragging")
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState("idle")
  }, [])

  const processExcelFile = async (file: File) => {
    setState("uploading")
    setFileName(file.name)
    setProgress(0)
    setProcessingStatus("Leyendo archivo...")

    try {
      // =====================================================
      // 1. LEER ARCHIVO EXCEL
      // =====================================================
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      
      // Buscar la hoja "BASE" (ignora mayúsculas/minúsculas)
      let sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase() === "base"
      )
      
      // Si no se encuentra "BASE", usar la primera hoja
      if (!sheetName) {
        sheetName = workbook.SheetNames[0]
        console.log(`Hoja "BASE" no encontrada. Usando hoja: "${sheetName}"`)
      } else {
        console.log(`Procesando hoja: "${sheetName}"`)
      }
      
      const worksheet = workbook.Sheets[sheetName]
      
      // Convertir a JSON
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet)
      
      if (!jsonData || jsonData.length === 0) {
        setState("error")
        setErrorMessage("El archivo está vacío o no tiene datos válidos")
        return
      }
      
      // Validar que existan los campos mínimos requeridos
      const firstRow = jsonData[0]
      if (!firstRow.AFIPOS || !firstRow.CODIGO_AFILIADO) {
        setState("error")
        setErrorMessage("El archivo no contiene las columnas requeridas (AFIPOS, CODIGO_AFILIADO)")
        return
      }

      setRecordCount(jsonData.length)
      setProgress(5)

      // =====================================================
      // 2. CREAR REGISTRO DE IMPORTACIÓN
      // =====================================================
      setProcessingStatus("Creando registro de importación...")
      
      const importStartTime = new Date().toISOString()
      const { success: createSuccess, importId, error: createError } = await createImportRecord(
        file.name,
        file.size,
        organizationId,
        userId
      )

      if (!createSuccess || !importId) {
        setState("error")
        setErrorMessage(`Error al crear registro: ${createError}`)
        toast.error("Error al iniciar importación")
        return
      }

      setProgress(10)

      // =====================================================
      // 3. PROCESAR EN LOTES
      // =====================================================
      let totalClientsCreated = 0
      let totalClientsUpdated = 0
      let totalTerminalsCreated = 0
      let totalTerminalsUpdated = 0
      let totalErrors: string[] = []

      const totalBatches = Math.ceil(jsonData.length / BATCH_SIZE)

      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE, jsonData.length)
        const batch = jsonData.slice(start, end)

        setProcessingStatus(`Procesando lote ${i + 1} de ${totalBatches} (${batch.length} filas)...`)

        const batchResult = await processBatchImport(batch, organizationId)

        if (batchResult.success) {
          totalClientsCreated += batchResult.clientsCreated
          totalClientsUpdated += batchResult.clientsUpdated
          totalTerminalsCreated += batchResult.terminalsCreated
          totalTerminalsUpdated += batchResult.terminalsUpdated
          totalErrors.push(...batchResult.errors)
        } else {
          totalErrors.push(...batchResult.errors)
        }

        // Actualizar progreso (10% - 80%)
        const batchProgress = 10 + Math.floor(((i + 1) / totalBatches) * 70)
        setProgress(batchProgress)
      }

      setProgress(85)

      // =====================================================
      // 4. DETECTAR RECUPERACIONES POR SISTEMA
      // =====================================================
      setProcessingStatus("Detectando recuperaciones automáticas...")

      const recoveryResult = await detectSystemRecoveries(organizationId, importStartTime)
      
      if (!recoveryResult.success) {
        console.error("Error en detección de recuperaciones:", recoveryResult.error)
        // No fallar la importación por esto, solo logearlo
      }

      setProgress(90)

      // =====================================================
      // 5. ACTUALIZAR REGISTRO DE IMPORTACIÓN
      // =====================================================
      setProcessingStatus("Finalizando...")

      const updateResult = await updateImportRecord(importId, {
        totalRows: jsonData.length,
        processedRows: jsonData.length - totalErrors.length,
        clientsCreated: totalClientsCreated,
        clientsUpdated: totalClientsUpdated,
        terminalsCreated: totalTerminalsCreated,
        terminalsUpdated: totalTerminalsUpdated,
        errorsCount: totalErrors.length,
        status: totalErrors.length === jsonData.length ? "failed" : "completed",
        errorMessage: totalErrors.length > 0 ? totalErrors.slice(0, 5).join("; ") : undefined,
      })

      if (!updateResult.success) {
        console.error("Error actualizando registro:", updateResult.error)
      }

      setProgress(100)

      // =====================================================
      // 6. MOSTRAR RESULTADO
      // =====================================================
      if (totalErrors.length === jsonData.length) {
        setState("error")
        setErrorMessage(`Todas las filas fallaron. Primeros errores: ${totalErrors.slice(0, 3).join(", ")}`)
        toast.error("Error al procesar archivo")
      } else {
        setState("complete")
        setProcessingStatus("")
        
        // Mensaje de éxito
        toast.success("Importación completada", {
          description: `${totalClientsCreated + totalClientsUpdated} clientes, ${totalTerminalsCreated + totalTerminalsUpdated} terminales procesados`,
        })

        if (totalErrors.length > 0) {
          toast.warning(`${totalErrors.length} filas con errores`)
        }

        if (recoveryResult.success && recoveryResult.recoveredCount > 0) {
          toast.info(`${recoveryResult.recoveredCount} terminales marcadas como recuperadas`)
        }

        if (onUploadComplete) {
          onUploadComplete({ 
            fileName: file.name, 
            recordCount: jsonData.length - totalErrors.length 
          })
        }
      }
    } catch (error) {
      console.error("Error procesando archivo:", error)
      setState("error")
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido al procesar el archivo")
      toast.error("Error al procesar archivo")
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState("idle")

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      
      // Validar extensión
      const validExtensions = [".xlsx", ".xls", ".csv"]
      const isValid = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

      if (!isValid) {
        setState("error")
        setErrorMessage("Formato de archivo no válido. Solo se permiten archivos .xlsx, .xls o .csv")
        return
      }

      startTransition(() => {
        processExcelFile(file)
      })
    }
  }, [organizationId, userId, onUploadComplete])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]

      // Validar extensión
      const validExtensions = [".xlsx", ".xls", ".csv"]
      const isValid = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

      if (!isValid) {
        setState("error")
        setErrorMessage("Formato de archivo no válido. Solo se permiten archivos .xlsx, .xls o .csv")
        return
      }

      startTransition(() => {
        processExcelFile(file)
      })
    }
  }

  const handleReset = () => {
    setState("idle")
    setProgress(0)
    setFileName("")
    setRecordCount(0)
    setErrorMessage("")
    setProcessingStatus("")
  }

  return (
    <Card className="p-8">
      {/* Estado: Idle o Dragging */}
      {(state === "idle" || state === "dragging") && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center transition-all",
            state === "dragging"
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-300 bg-slate-50 hover:border-slate-400"
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center transition-colors",
                state === "dragging" ? "bg-indigo-100" : "bg-slate-100"
              )}
            >
              <UploadCloud
                className={cn(
                  "h-10 w-10",
                  state === "dragging" ? "text-indigo-600" : "text-slate-400"
                )}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Arrastra tu archivo Excel aquí
              </h3>
              <p className="text-sm text-slate-500">
                o haz clic en el botón para buscar el archivo en tu ordenador
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Formatos: .xlsx, .xls, .csv (máx 10,000 filas)
              </p>
            </div>
            <label htmlFor="file-input">
              <Button type="button" className="bg-slate-900 hover:bg-slate-800" disabled={isPending}>
                Seleccionar Archivo
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isPending}
              />
            </label>
          </div>
        </div>
      )}

      {/* Estado: Uploading */}
      {state === "uploading" && (
        <div className="border-2 border-slate-200 rounded-xl p-12 text-center bg-white">
          <div className="flex flex-col items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
              <FileSpreadsheet className="h-10 w-10 text-indigo-600" />
            </div>
            <div className="w-full max-w-md space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">{fileName}</span>
                <span className="text-slate-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-500">{processingStatus}</p>
              {recordCount > 0 && (
                <p className="text-xs text-slate-400">
                  {recordCount} filas detectadas
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estado: Complete */}
      {state === "complete" && (
        <div className="border-2 border-emerald-200 rounded-xl p-12 text-center bg-emerald-50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-1">
                ¡Archivo procesado exitosamente!
              </h3>
              <p className="text-sm text-emerald-700 mb-2">{fileName}</p>
              <p className="text-sm text-emerald-600 font-medium">
                {recordCount} registros procesados
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              Cargar otro archivo
            </Button>
          </div>
        </div>
      )}

      {/* Estado: Error */}
      {state === "error" && (
        <div className="border-2 border-red-200 rounded-xl p-12 text-center bg-red-50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">
                Error al procesar el archivo
              </h3>
              <p className="text-sm text-red-700 mb-2">{fileName}</p>
              <p className="text-sm text-red-600 max-w-md">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-blue-900">
              Formato Requerido
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Template Maestro con hoja "BASE". Columnas principales: CODIGO_AFILIADO, NOMBRE_AFILIADO, RIF_AFILIADO, AFIPOS, NUMPOS, RANGO
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-amber-900">Restricciones</p>
            <p className="text-xs text-amber-700 mt-1">
              Max 10,000 filas. UTF-8. Sin celdas combinadas.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
