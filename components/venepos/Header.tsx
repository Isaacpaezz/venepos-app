"use client"

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MobileSidebar } from '@/components/venepos/Sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const rutasNombres: Record<string, string> = {
  '/': 'Panel',
  '/clients': 'Clientes',
  '/campaigns': 'Campañas',
  '/import': 'Importar',
  '/settings': 'Configuración',
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const nombreRuta = rutasNombres[pathname] || 'Panel'

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">VenePOS</span>
      {pathname !== '/' && (
        <>
          <span className="text-slate-400">›</span>
          <span className="text-slate-900 font-medium">{nombreRuta}</span>
        </>
      )}
    </div>
  )
}

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Botón de menú móvil */}
        <MobileSidebar />

        {/* Breadcrumbs */}
        <div className="flex-1">
          <Breadcrumbs pathname={pathname} />
        </div>

        {/* Barra de búsqueda global */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Búsqueda global (Cmd+K)"
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Botón de búsqueda móvil */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* Notificaciones */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-indigo-600 text-white">
                    CR
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Carlos Ruiz</p>
                  <p className="text-xs text-muted-foreground">
                    admin@credicardpos.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
