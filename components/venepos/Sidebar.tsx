"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Upload,
  Settings,
  ChevronLeft,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

interface NavItem {
  titulo: string
  href: string
  icono: React.ReactNode
}

const navItems: NavItem[] = [
  {
    titulo: 'Panel',
    href: '/dashboard',
    icono: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    titulo: 'Clientes',
    href: '/clients',
    icono: <Users className="h-5 w-5" />,
  },
  {
    titulo: 'Campañas',
    href: '/campaigns',
    icono: <Megaphone className="h-5 w-5" />,
  },
  {
    titulo: 'Importar',
    href: '/import',
    icono: <Upload className="h-5 w-5" />,
  },
  {
    titulo: 'Configuración',
    href: '/settings',
    icono: <Settings className="h-5 w-5" />,
  },
]

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-2 px-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50'
                : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
            )}
          >
            {item.icono}
            <span>{item.titulo}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileSidebar() {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-[#1E293B] border-slate-700/50">
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-white font-semibold text-xl">VenePOS</span>
          </div>
        </div>

        <ScrollArea className="flex-1 py-6">
          <div className="px-6 mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Menú Principal
            </p>
          </div>
          <NavLinks pathname={pathname} />
        </ScrollArea>

        <div className="border-t border-slate-700/50 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-medium">CR</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Carlos Ruiz
              </p>
              <p className="text-xs text-slate-400 truncate">Jefe de Recuperación</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 bg-[#1E293B] border-r border-slate-700/50 transition-all duration-300',
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700/50">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">VP</span>
              </div>
              <span className="text-white font-semibold text-lg">VenePOS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-700/70"
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                isCollapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          {!isCollapsed ? (
            <NavLinks pathname={pathname} />
          ) : (
            <nav className="space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-center rounded-lg p-2.5 transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    )}
                  >
                    {item.icono}
                  </Link>
                )
              })}
            </nav>
          )}
        </ScrollArea>

        <div className="border-t border-slate-700/50 p-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-medium">CR</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Carlos Ruiz
                </p>
                <p className="text-xs text-slate-400 truncate">Jefe de Recuperación</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">CR</span>
              </div>
            </div>
          )}
        </div>
      </aside>
  )
}
