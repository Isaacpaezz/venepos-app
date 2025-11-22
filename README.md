# VenePOS 🚀

**Enterprise Point of Sale Recovery Platform**

VenePOS es una plataforma SaaS B2B diseñada para instituciones financieras y adquirentes que gestionan flotas de puntos de venta (POS). Optimiza la recuperación de terminales inactivas mediante campañas automatizadas, análisis predictivo y gestión centralizada de comunicaciones con comercios afiliados.

---

## 🎯 Problema que Resuelve

Las instituciones financieras pierden ingresos significativos cuando sus terminales POS quedan inactivas. VenePOS automatiza:

- ✅ **Detección proactiva** de terminales sin transacciones
- ✅ **Campañas multicanal** (WhatsApp, SMS, Email) para reactivación
- ✅ **Seguimiento unificado** del ciclo de vida de cada caso
- ✅ **Analítica en tiempo real** de tasas de recuperación
- ✅ **Integración con Chatwoot** para soporte contextual

---

## 🛠️ Tech Stack

![Next.js](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Shadcn UI](https://img.shields.io/badge/Shadcn%20UI-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

**Frontend:**
- **Next.js 15** con App Router (React Server Components)
- **React 19** (hooks avanzados y Suspense)
- **TypeScript** (tipado estricto end-to-end)
- **Tailwind CSS v4** (variables CSS nativas)
- **Shadcn UI** (componentes accesibles con Radix UI)
- **Recharts** (gráficos de analítica)
- **Lucide React** (iconografía moderna)
- **TanStack Table v8** (tablas avanzadas con filtros)

**Estado (Actual - Mock Data):**
- `lib/data.ts` - Base de datos simulada con tipado TypeScript
- URL State Management con `searchParams`
- Preparado para migración a **Supabase** (Phase 2)

---

## ✨ Features Principales

### 📊 **Executive Dashboard**
Panel de control con KPIs en tiempo real:
- Terminales recuperadas vs inactivas
- Recuperación mensual de ingresos
- Tasa de conversión de campañas
- Gráfico de tendencias (7 días)
- Feed de actividad reciente

### 👥 **Client Management**
Gestión avanzada de comercios afiliados:
- Tabla de datos con 1000+ clientes (paginación, sorting, filtros)
- Sheet 360° con vista detallada del cliente
- Historial de transacciones y campañas
- Filtros dinámicos: banco, región, rango de inactividad
- Exportación a Excel
- Avatares generados automáticamente

### 🚀 **Campaign Kanban Board**
Gestión visual del ciclo de vida de campañas:
- Drag & Drop entre columnas (Borrador → Activo → Completado)
- Estados codificados por color
- Métricas en tiempo real por campaña
- Filtros por canal (WhatsApp, SMS, Email)
- Modal de creación rápida con `?new=true`

### 🧙‍♂️ **Campaign Wizard**
Creación guiada de campañas en 3 pasos:
- **Step 1:** Configuración (nombre, canal, fecha)
- **Step 2:** Segmentación de audiencia (banco, días inactivos, región)
- **Step 3:** Diseño del mensaje con vista previa en vivo
- Mockup de celular con renderizado real
- Validaciones por paso
- Guardado en draft

### 📥 **Smart Import Module**
Carga masiva de datos con validación:
- Drag & Drop de archivos Excel/CSV
- Estados visuales: idle, dragging, uploading, complete, error
- Barra de progreso animada
- Validación de formato y extensión
- Historial de importaciones con detalles
- Plantilla descargable

### 💬 **Chatwoot Integration**
Sidebar contextual para agentes de soporte:
- Detección automática de cliente por email (`?email=...`)
- Vista compacta con KPIs clave
- Botón de apertura en nueva pestaña
- Estado vacío si cliente no existe
- Optimizado para iframe (300px width)

### ⚙️ **Settings & Configuration**
Panel de administración empresarial:
- **General:** Perfil de la organización (RIF, dirección, zona horaria)
- **Equipo:** Gestión de usuarios (roles: Admin, Agent, Viewer)
- **Integraciones:** Configuración de Chatwoot (URL, Token, Account ID)
- **Facturación:** Plan actual, método de pago, uso del plan

### 👤 **User Profile**
Gestión de cuenta personal:
- Información personal y contacto
- Cambio de contraseña con validación
- Autenticación de dos factores (2FA)
- Preferencias de apariencia (claro, oscuro, sistema)
- Notificaciones configurables

### 🔐 **Authentication Flow**
Sistema completo de autenticación:
- **Login:** Email/password + Google OAuth
- **Registro:** Multi-step (datos personales + empresa)
- **Onboarding:** 3 pasos (Welcome → Chatwoot → Team)
- Split-screen design con testimonial
- Validaciones en tiempo real

---

## 📁 Project Structure

```
venepos-app/
├── app/
│   ├── (auth)/                    # Rutas de autenticación (sin dashboard layout)
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx            # Split-screen layout
│   ├── auth/
│   │   └── onboarding/           # Onboarding post-registro
│   ├── (dashboard)/               # Rutas con sidebar y header
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── clients/              # Gestión de clientes
│   │   ├── campaigns/            # Kanban de campañas
│   │   ├── import/               # Módulo de importación
│   │   ├── settings/             # Configuración
│   │   ├── profile/              # Perfil de usuario
│   │   └── layout.tsx            # Layout con Sidebar + Header
│   ├── integrations/
│   │   └── chatwoot-sidebar/     # Sidebar standalone (no layout)
│   └── layout.tsx                 # Root layout (fuentes, metadata)
│
├── components/
│   ├── ui/                        # Componentes base de Shadcn UI
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── tabs.tsx
│   │   └── ... (30+ componentes)
│   │
│   └── venepos/                   # Componentes de negocio
│       ├── Header.tsx             # Header con búsqueda y perfil
│       ├── Sidebar.tsx            # Navegación principal + mobile menu
│       ├── dashboard/
│       │   ├── kpi-grid.tsx
│       │   ├── recovery-chart.tsx
│       │   └── recent-activity.tsx
│       ├── clients/
│       │   ├── data-table.tsx     # TanStack Table
│       │   ├── columns.tsx        # Definición de columnas
│       │   ├── client-sheet.tsx   # Vista 360°
│       │   └── client-filters.tsx
│       ├── campaigns/
│       │   ├── campaign-board.tsx # Kanban board
│       │   ├── campaign-card.tsx  # Card arrastrable
│       │   └── campaign-wizard.tsx# Wizard de 3 pasos
│       ├── import/
│       │   ├── file-upload.tsx
│       │   └── import-history.tsx
│       └── settings/
│           ├── chatwoot-form.tsx
│           └── team-list.tsx
│
├── lib/
│   ├── data.ts                    # Mock data (clientes, campañas, etc.)
│   └── utils.ts                   # Utilidades (cn, formatters)
│
├── types/
│   └── index.ts                   # Tipos TypeScript globales
│
├── public/                        # Assets estáticos
│
└── tailwind.config.ts             # Configuración de Tailwind v4
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.17 o superior
- **pnpm** 8.0 o superior (recomendado)

### Installation

```bash
# Clonar el repositorio
git clone https://github.com/tu-org/venepos-platform.git
cd venepos-platform/venepos-app

# Instalar dependencias
pnpm install

# Crear archivo de variables de entorno (opcional para Phase 1)
cp .env.example .env.local

# Iniciar servidor de desarrollo
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

### Build para Producción

```bash
# Generar build optimizado
pnpm build

# Vista previa del build
pnpm start
```

### Scripts Disponibles

```bash
pnpm dev          # Desarrollo con Turbopack
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # Linter de código
pnpm type-check   # Verificación de tipos
```

---

## 🎨 Design System

### Color Palette

```css
/* Primarios */
--indigo-600: #4F46E5;      /* Botones, links activos */
--slate-900: #0F172A;       /* Textos principales */
--slate-50: #F8FAFC;        /* Fondos secundarios */

/* Semánticos */
--emerald-600: #10B981;     /* Success */
--red-600: #DC2626;         /* Error */
--amber-600: #D97706;       /* Warning */
```

### Typography

- **Fuente:** Inter (Variable Font)
- **Títulos:** font-bold, text-2xl a text-4xl
- **Cuerpo:** font-medium, text-sm a text-base
- **Metadata:** font-normal, text-xs

### Components Style

- **Borders:** rounded-xl (12px) por defecto
- **Shadows:** shadow-sm para cards, shadow-lg para modals
- **Spacing:** Escala de 4px (gap-4, p-6, etc.)
- **Transitions:** transition-all duration-200

---

## 📊 Mock Data Overview

### Clientes (100+ registros)
```typescript
{
  id, afipos, codigoAfiliado, name, rif,
  telefono, email, banco, region, estado, ciudad,
  terminalsCount, rango, gestion, initials
}
```

### Campañas (20+ registros)
```typescript
{
  id, nombre, estado, audiencia, fechaEjecucion,
  canal, progreso, estadisticas { enviados, respondidos, recuperados }
}
```

### Team Members
```typescript
{
  id, name, email, role, status, avatar, lastActive
}
```

---

## 🗺️ Roadmap

### ✅ Phase 1: Frontend Construction (Completado)
- Dashboard ejecutivo con KPIs
- CRUD de clientes con tabla avanzada
- Kanban de campañas con wizard
- Módulo de importación
- Autenticación y onboarding
- Integración visual con Chatwoot

### 🚧 Phase 2: Backend & Database (Próximo)
- Migración a Supabase (PostgreSQL)
- API Routes con Next.js 15
- Autenticación real con Supabase Auth
- Row Level Security (RLS)
- Real-time subscriptions

### 🔮 Phase 3: Integrations
- Chatwoot API (crear contactos, enviar mensajes)
- WhatsApp Business API
- Twilio SMS Gateway
- Sendgrid Email
- Webhooks para eventos

### 🔮 Phase 4: Advanced Features
- IA para predicción de churn
- Recomendaciones automáticas de campañas
- A/B Testing de mensajes
- Analytics Dashboard avanzado
- Multi-tenancy

---

## 🤝 Contributing

Este es un proyecto propietario en desarrollo. Si deseas contribuir:

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 📄 License

Copyright © 2025 VenePOS Inc. Todos los derechos reservados.

Este software es propietario y confidencial. No está permitida la distribución, modificación o uso sin autorización expresa.

---

## 📧 Contact

**VenePOS Team**
- Website: https://venepos.com
- Email: support@venepos.com
- LinkedIn: [@venepos](https://linkedin.com/company/venepos)

---

## 🙏 Acknowledgments

- [Next.js Team](https://nextjs.org) por el framework
- [Shadcn](https://ui.shadcn.com) por los componentes UI
- [Vercel](https://vercel.com) por el hosting
- Comunidad de desarrolladores de React

---

**Made with ❤️ by the VenePOS Team**
