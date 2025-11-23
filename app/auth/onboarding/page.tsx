"use client"

import { useState } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  MessageSquare,
  Users,
  CheckCircle2,
  Link as LinkIcon,
} from "lucide-react"

type OnboardingStep = "welcome" | "chatwoot" | "team"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>("welcome")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Chatwoot form data
  const [chatwootData, setChatwootData] = useState({
    url: "",
    token: "",
    accountId: "",
  })

  // Team members data
  const [teamMembers, setTeamMembers] = useState([
    { email: "", role: "agent" },
    { email: "", role: "agent" },
    { email: "", role: "agent" },
  ])

  const handleVerifyChatwoot = () => {
    setIsVerifying(true)
    // Simular verificación de conexión
    setTimeout(() => {
      setIsVerifying(false)
      setIsConnected(true)
    }, 2000)
  }

  const handleContinueToChatwoot = () => {
    setStep("chatwoot")
  }

  const handleContinueToTeam = () => {
    if (isConnected) {
      setStep("team")
    }
  }

  const handleFinish = () => {
    console.log("Onboarding complete:", { chatwootData, teamMembers })
    router.push("/")
  }

  const handleSkipChatwoot = () => {
    setStep("team")
  }

  const updateTeamMember = (index: number, field: "email" | "role", value: string) => {
    const updated = [...teamMembers]
    updated[index][field] = value
    setTeamMembers(updated)
  }

  const getStepNumber = () => {
    if (step === "welcome") return 0
    if (step === "chatwoot") return 1
    return 2
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Progress Indicators */}
        {step !== "welcome" && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                getStepNumber() >= 1 ? "bg-indigo-600" : "bg-slate-300"
              }`}
            />
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                getStepNumber() >= 2 ? "bg-indigo-600" : "bg-slate-300"
              }`}
            />
          </div>
        )}

        {/* Main Card */}
        <Card className="shadow-2xl border-0">
          <CardContent className="p-8">
            {/* Step 1: Welcome */}
            {step === "welcome" && (
              <div className="text-center space-y-6">
                {/* Animated Logo */}
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-white font-bold text-3xl">V</span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    ¡Bienvenido a VenePOS!
                  </h1>
                  <p className="text-slate-600">
                    Tu espacio de trabajo ha sido creado exitosamente.
                    Configuremos lo básico para empezar a operar.
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={handleContinueToChatwoot}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  Comenzar Configuración
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Chatwoot */}
            {step === "chatwoot" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Conectar Chatwoot
                    </h2>
                    <p className="text-sm text-slate-600">
                      Vincula tu instancia para sincronizar contactos y
                      campañas.
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="chatwoot-url">URL de Instancia Chatwoot</Label>
                    <Input
                      id="chatwoot-url"
                      type="url"
                      placeholder="https://app.chatwoot.com"
                      value={chatwootData.url}
                      onChange={(e) =>
                        setChatwootData({ ...chatwootData, url: e.target.value })
                      }
                      disabled={isConnected}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chatwoot-token">User API Token</Label>
                    <Input
                      id="chatwoot-token"
                      type="password"
                      placeholder="Pegar token aquí..."
                      value={chatwootData.token}
                      onChange={(e) =>
                        setChatwootData({ ...chatwootData, token: e.target.value })
                      }
                      disabled={isConnected}
                    />
                    <p className="text-xs text-slate-500">
                      Lo encuentras en Perfil → Configuración de Perfil.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chatwoot-account">ID de Cuenta (Account ID)</Label>
                    <Input
                      id="chatwoot-account"
                      type="text"
                      placeholder="Ej. 1"
                      value={chatwootData.accountId}
                      onChange={(e) =>
                        setChatwootData({
                          ...chatwootData,
                          accountId: e.target.value,
                        })
                      }
                      disabled={isConnected}
                    />
                  </div>

                  {/* Success Message */}
                  {isConnected && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-medium text-emerald-900">
                        Conexión establecida correctamente.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {!isConnected ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleSkipChatwoot}
                      >
                        Omitir por ahora
                      </Button>
                      <Button
                        className="flex-1 bg-slate-900 hover:bg-slate-800"
                        onClick={handleVerifyChatwoot}
                        disabled={
                          isVerifying ||
                          !chatwootData.url ||
                          !chatwootData.token ||
                          !chatwootData.accountId
                        }
                      >
                        {isVerifying ? (
                          <>
                            <LinkIcon className="h-4 w-4 mr-2 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Verificar Conexión
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={handleContinueToTeam}
                    >
                      Continuar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Team */}
            {step === "team" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Invitar al Equipo
                    </h2>
                    <p className="text-sm text-slate-600">
                      Agrega colaboradores a tu organización.
                    </p>
                  </div>
                </div>

                {/* Team Members List */}
                <div className="space-y-3">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="colaborador@empresa.com"
                        value={member.email}
                        onChange={(e) =>
                          updateTeamMember(index, "email", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          updateTeamMember(index, "role", value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agente</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <Button
                  variant="link"
                  className="text-indigo-600 p-0 h-auto"
                  onClick={() =>
                    setTeamMembers([...teamMembers, { email: "", role: "agent" }])
                  }
                >
                  + Agregar otro
                </Button>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleFinish}
                  >
                    Omitir
                  </Button>
                  <Button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleFinish}
                  >
                    Finalizar y Entrar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
