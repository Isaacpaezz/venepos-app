"use client"

import { FileUpload } from "@/components/venepos/import/file-upload"
import { ImportHistory } from "@/components/venepos/import/import-history"

export default function ImportPage() {
  const handleUploadComplete = (data: { fileName: string; recordCount: number }) => {
    console.log("Upload complete:", data)
    // Aquí podrías actualizar el historial o hacer una llamada a la API
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Importar Datos
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Carga masiva de clientes y transacciones mediante CSV o Excel.
        </p>
      </div>

      {/* File Upload */}
      <FileUpload onUploadComplete={handleUploadComplete} />

      {/* Import History */}
      <ImportHistory />
    </div>
  )
}
