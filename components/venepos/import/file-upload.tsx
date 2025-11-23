"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, X } from "lucide-react"
import { cn } from "@/lib/utils"

type UploadState = "idle" | "dragging" | "uploading" | "complete" | "error"

interface FileUploadProps {
  onUploadComplete?: (data: { fileName: string; recordCount: number }) => void
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [state, setState] = useState<UploadState>("idle")
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState("")
  const [recordCount, setRecordCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState("dragging")
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState("idle")
  }, [])

  const simulateUpload = (file: File) => {
    setState("uploading")
    setFileName(file.name)
    setProgress(0)

    // Simular progreso de carga
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Simular procesamiento
    setTimeout(() => {
      clearInterval(interval)
      
      // Validar tipo de archivo
      const validExtensions = [".xlsx", ".xls", ".csv"]
      const isValid = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

      if (!isValid) {
        setState("error")
        setErrorMessage("Formato de archivo no válido. Solo se permiten archivos .xlsx, .xls o .csv")
        return
      }

      // Simular conteo de registros
      const mockRecordCount = Math.floor(Math.random() * 300) + 100
      setRecordCount(mockRecordCount)
      setState("complete")

      if (onUploadComplete) {
        onUploadComplete({ fileName: file.name, recordCount: mockRecordCount })
      }
    }, 2000)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState("idle")

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      simulateUpload(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      simulateUpload(files[0])
    }
  }

  const handleReset = () => {
    setState("idle")
    setProgress(0)
    setFileName("")
    setRecordCount(0)
    setErrorMessage("")
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
                Arrastra tu archivo CSV/XLSX aquí
              </h3>
              <p className="text-sm text-slate-500">
                o haz clic en el botón para buscar los archivos en tu ordenador
              </p>
            </div>
            <label htmlFor="file-input">
              <Button type="button" className="bg-slate-900 hover:bg-slate-800">
                Seleccionar Archivo
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
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
              <p className="text-sm text-slate-500">Procesando filas...</p>
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
                ¡Archivo cargado exitosamente!
              </h3>
              <p className="text-sm text-emerald-700 mb-2">{fileName}</p>
              <p className="text-sm text-emerald-600 font-medium">
                {recordCount} registros detectados
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
                Error al cargar el archivo
              </h3>
              <p className="text-sm text-red-700 mb-2">{fileName}</p>
              <p className="text-sm text-red-600">{errorMessage}</p>
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
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-emerald-900">
              Plantilla de Clientes
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              Descarga el formato requerido.
            </p>
            <Button
              variant="link"
              className="text-emerald-600 hover:text-emerald-700 p-0 h-auto text-xs mt-1"
            >
              Descargar CSV
            </Button>
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
