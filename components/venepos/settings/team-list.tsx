import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockTeamMembers } from "@/lib/data"
import { Plus, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "admin":
      return "bg-indigo-100 text-indigo-700 border-indigo-200"
    case "agent":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "viewer":
      return "bg-slate-100 text-slate-600 border-slate-200"
    default:
      return "bg-slate-100 text-slate-600 border-slate-200"
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "invited":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "disabled":
      return "bg-red-100 text-red-700 border-red-200"
    default:
      return "bg-slate-100 text-slate-600 border-slate-200"
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Admin"
    case "agent":
      return "Agent"
    case "viewer":
      return "Viewer"
    default:
      return role
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Activo"
    case "invited":
      return "Invitado"
    case "disabled":
      return "Desactivado"
    default:
      return status
  }
}

export function TeamList() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Miembros del Equipo</CardTitle>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Invitar Miembro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs font-medium text-slate-500 uppercase border-b">
            <div className="w-12">Usuario</div>
            <div></div>
            <div className="w-24 text-center">Rol</div>
            <div className="w-28 text-center">Estado</div>
            <div className="w-28 text-right">Último Acceso</div>
          </div>

          {/* Team Members */}
          {mockTeamMembers.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-slate-50 rounded-lg transition-colors"
            >
              {/* Avatar + Name/Email */}
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-slate-700 text-white font-semibold">
                  {member.avatar || member.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {member.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{member.email}</p>
              </div>

              {/* Role Badge */}
              <div className="w-24 flex justify-center">
                <Badge className={cn("border", getRoleBadgeColor(member.role))}>
                  {getRoleLabel(member.role)}
                </Badge>
              </div>

              {/* Status Badge */}
              <div className="w-28 flex justify-center">
                <Badge
                  className={cn("border", getStatusBadgeColor(member.status))}
                >
                  {getStatusLabel(member.status)}
                </Badge>
              </div>

              {/* Last Active + Actions */}
              <div className="w-28 flex items-center justify-end gap-2">
                <span className="text-xs text-slate-500">
                  {member.lastActive}
                </span>
                <Button variant="ghost" size="icon-sm" className="text-slate-400">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
