"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Users,
} from "lucide-react"

type OnboardingStep = "welcome" | "team"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>("welcome")

  // Team members data
  const [teamMembers, setTeamMembers] = useState([
    { email: "", role: "agent" },
    { email: "", role: "agent" },
    { email: "", role: "agent" },
  ])

  const handleContinueToTeam = () => {
    setStep("team")
  }

  const handleFinish = () => {
    console.log("Onboarding complete:", { teamMembers })
    router.push("/dashboard")
  }

  const updateTeamMember = (index: number, field: "email" | "role", value: string) => {
    const updated = [...teamMembers]
    updated[index][field] = value
    setTeamMembers(updated)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Progress Indicator (solo para paso team) */}
        {step === "team" && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-2 w-2 rounded-full bg-indigo-600" />
            <div className="h-2 w-2 rounded-full bg-indigo-600" />
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
                  onClick={handleContinueToTeam}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  Comenzar Configuración
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Team */}
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
                      Agrega colaboradores a tu organización. (Opcional)
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
