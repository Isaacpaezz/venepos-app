import { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-white text-xl font-bold">VenePOS</span>
          </div>

          {/* Main Content */}
          <div className="mt-20">
            <h1 className="text-4xl font-bold text-white mb-6">
              La plataforma integral para la recuperación de puntos de venta
              Credicard.
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Gestiona terminales, automatiza campañas y recupera cartera
              vencida de forma centralizada e inteligente.
            </p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">MR</span>
              </div>
              <div>
                <p className="text-white text-sm mb-2">
                  &ldquo;Recuperamos el 30% de la flota inactiva en solo un mes
                  gracias a las campañas automatizadas de VenePOS.&rdquo;
                </p>
                <p className="text-slate-300 text-xs">
                  María Rodríguez, Gerente de Recuperación
                </p>
              </div>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-6">
            © 2025 VenePOS Inc. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right Panel - Form Container */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
