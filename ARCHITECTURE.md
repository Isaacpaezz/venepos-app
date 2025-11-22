# VenePOS Architecture Documentation

**Technical Manual for Developers**

Este documento describe la arquitectura técnica, patrones de diseño y decisiones de implementación de VenePOS Platform. Debe leerse antes de empezar el desarrollo del Backend (Phase 2).

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Design System](#design-system)
3. [State Management Strategy](#state-management-strategy)
4. [Data Layer Architecture](#data-layer-architecture)
5. [Routing & Layouts](#routing--layouts)
6. [Key Components Documentation](#key-components-documentation)
7. [Performance Optimizations](#performance-optimizations)
8. [Migration Path to Backend](#migration-path-to-backend)

---

## 1. Tech Stack Overview

### Core Framework

**Next.js 15 (App Router)**
- React Server Components por defecto
- Streaming SSR con Suspense
- Turbopack para dev builds (10x más rápido)
- Image optimization automática
- Route groups para organización

**React 19**
- Server Components y Client Components
- `useTransition` para transiciones suaves
- `useFormStatus` para estados de formularios
- Suspense boundaries mejorados

### Styling & UI

**Tailwind CSS v4**
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --font-family-inter: "Inter", sans-serif;
  --color-indigo-600: #4F46E5;
  /* Variables CSS nativas */
}
```

- **Ventajas:** Autocompletado en VS Code, mejor performance
- **Convención:** Utility-first approach, componentes sin CSS modules

**Shadcn UI + Radix UI**
- Componentes accesibles (WAI-ARIA)
- Instalación selectiva (no es una librería)
- Personalizables via `components/ui/`
- Temas con CSS variables

### State & Data Fetching

- **URL State:** `useSearchParams` para filtros y modales
- **Local State:** `useState` + `useReducer` para UI state
- **Form State:** `react-hook-form` + `zod` (preparado para Phase 2)
- **Server State:** Mock data en `lib/data.ts` → Supabase en Phase 2

---

## 2. Design System

### Configuración de Tailwind v4

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: "var(--color-indigo-600)",
        sidebar: "#1E293B",
      },
      borderRadius: {
        xl: "12px",  // Estándar para cards
        "4xl": "32px", // Para modales y mockups
      }
    }
  }
}
```

### Paleta de Colores Semánticos

```typescript
// types/index.ts - Color mapping
const STATUS_COLORS = {
  active: "emerald", // Verde para activo/success
  inactive: "red",   // Rojo para inactivo/error
  pending: "amber",  // Ámbar para pendiente/warning
  draft: "slate"     // Gris para borradores
}
```

### Typography Scale

```tsx
// Jerarquía establecida
<h1 className="text-3xl font-bold">  {/* Page titles */}
<h2 className="text-xl font-bold">   {/* Section titles */}
<h3 className="text-lg font-semibold"> {/* Card titles */}
<p className="text-sm">              {/* Body text */}
<span className="text-xs">           {/* Metadata */}
```

### Component Patterns

**Card Standard:**
```tsx
<Card className="rounded-xl border-slate-200 shadow-sm bg-white">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>{/* Contenido */}</CardContent>
</Card>
```

**Button Variants:**
- `default`: bg-indigo-600 (Primary actions)
- `outline`: border-slate-300 (Secondary actions)
- `ghost`: hover:bg-slate-100 (Tertiary actions)

---

## 3. State Management Strategy

### URL State Management

**Pattern:** Usar `searchParams` para estado compartible y persistente

```typescript
// app/(dashboard)/campaigns/page.tsx
"use client"

function CampaignsPage() {
  const searchParams = useSearchParams()
  const showWizard = searchParams.get('new') === 'true'
  
  // ✅ Estado en URL: /campaigns?new=true
  // ✅ Compartible, recargable, bookmarkable
}
```

**Casos de uso:**
- Filtros de tabla: `?bank=Banplus&status=active`
- Modales/Dialogs: `?new=true`, `?edit=123`
- Paginación: `?page=2&limit=50`

### Server vs Client Components

**Regla General:**
```
├── page.tsx              → Server Component (default)
├── layout.tsx            → Server Component
└── components/
    ├── data-table.tsx    → Client ("use client")
    ├── wizard.tsx        → Client ("use client")
    └── kpi-grid.tsx      → Server (sin interactividad)
```

**Cuándo usar Client Components:**
- Event handlers (`onClick`, `onChange`)
- Hooks de React (`useState`, `useEffect`, `useSearchParams`)
- Browser APIs (`localStorage`, `window`)
- Librerías que requieren context (`react-hook-form`)

**Optimización:**
```tsx
// ✅ BIEN: Componente pequeño Client, resto Server
<ServerParent>
  <ClientButton />  {/* Solo este es cliente */}
</ServerParent>

// ❌ MAL: Todo el árbol se vuelve cliente
"use client"
<Parent>
  <Child>
    <Button />  {/* Un botón convierte todo en cliente */}
  </Child>
</Parent>
```

### Suspense Boundaries

```tsx
// app/(dashboard)/clients/page.tsx
import { Suspense } from 'react'

export default function ClientsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ClientTable />
    </Suspense>
  )
}
```

**Ventajas:**
- Streaming SSR (muestra UI mientras carga data)
- Error boundaries aislados
- Progressive enhancement

---

## 4. Data Layer Architecture

### Estructura Actual (Mock Data)

```typescript
// lib/data.ts
export const clientsData: Client[] = [...]
export const campaignsData: Campaign[] = [...]
export const mockTeamMembers: TeamMember[] = [...]
export const chartData = [...]
```

**Tipado Estricto:**
```typescript
// types/index.ts
export interface Client {
  id: string
  afipos: number
  codigoAfiliado: string
  name: string
  rif: string
  telefono: string
  email?: string  // Opcional para Chatwoot
  banco: string
  region: string
  estado: string
  ciudad: string
  terminalsCount: number
  rango: string  // "SIN TX EN EL MES ACTUAL"
  gestion: string
  initials: string
}
```

### Migration Path a Supabase (Phase 2)

**1. Schema SQL:**
```sql
-- migrations/001_initial.sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  afipos bigint unique not null,
  codigo_afiliado text not null,
  name text not null,
  rif text unique not null,
  telefono text,
  email text,
  banco text not null,
  region text,
  estado text,
  ciudad text,
  terminals_count int default 0,
  rango text,
  gestion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table clients enable row level security;

create policy "Users can view clients in their org"
  on clients for select
  using (org_id = auth.uid());
```

**2. Reemplazar Mock Data:**
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Uso en Server Component
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}
```

**3. TypeScript Types Auto-generados:**
```bash
npx supabase gen types typescript --project-id <ref> > types/supabase.ts
```

---

## 5. Routing & Layouts

### Route Groups

```
app/
├── (auth)/           # Sin dashboard layout
│   ├── login/
│   ├── register/
│   └── layout.tsx   # Split-screen
│
├── (dashboard)/      # Con sidebar + header
│   ├── page.tsx     # Dashboard
│   ├── clients/
│   ├── campaigns/
│   └── layout.tsx   # Sidebar + Header
│
└── integrations/
    └── chatwoot-sidebar/  # Standalone (sin layout)
```

**Ventajas:**
- `/login` NO tiene sidebar
- `/clients` SÍ tiene sidebar
- `/integrations/chatwoot-sidebar` es standalone para iframe

### Layout Nesting

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
```

**Margen izquierdo `lg:pl-64`:**
- Desktop: Sidebar fijo (w-64), content con padding-left
- Mobile: Sidebar oculto, content full-width

---

## 6. Key Components Documentation

### DataTable Pattern

**File: `components/venepos/clients/data-table.tsx`**

```typescript
interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  // Dumb component: NO maneja filtros
}

export function DataTable<TData>({ columns, data }: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Lógica de tabla
  })
  
  return <table>{/* Render */}</table>
}
```

**Usage in Page:**
```tsx
// app/(dashboard)/clients/page.tsx
"use client"

export default function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  
  // ✅ Page maneja la lógica de selección
  const handleRowClick = (client: Client) => {
    setSelectedClient(client)
  }
  
  return (
    <>
      <DataTable 
        columns={columns} 
        data={clientsData}
        onRowClick={handleRowClick}  // Callback desde page
      />
      
      <ClientSheet 
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
      />
    </>
  )
}
```

**Pattern Benefits:**
- DataTable es reutilizable para cualquier entidad
- Page tiene control total del estado
- Fácil testeo (DataTable es pure component)

### CampaignWizard Flow

**File: `components/venepos/campaigns/campaign-wizard.tsx`**

```typescript
type WizardStep = 'config' | 'audience' | 'message'

export function CampaignWizard({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<WizardStep>('config')
  const [formData, setFormData] = useState<CampaignWizardData>({
    nombre: '',
    canal: 'whatsapp',
    audiencia: { banco: '', diasInactividad: '', region: '' },
    mensaje: ''
  })
  
  // Validación por paso
  const canProceed = () => {
    switch (step) {
      case 'config': return formData.nombre && formData.canal
      case 'audience': return formData.audiencia.diasInactividad
      case 'message': return formData.mensaje.length > 10
    }
  }
  
  // Navegación
  const handleNext = () => {
    if (step === 'config') setStep('audience')
    else if (step === 'audience') setStep('message')
    else handleSave()
  }
  
  return (
    <Dialog open={isOpen}>
      {step === 'config' && <ConfigStep data={formData} onChange={setFormData} />}
      {step === 'audience' && <AudienceStep data={formData} onChange={setFormData} />}
      {step === 'message' && <MessageStep data={formData} onChange={setFormData} />}
      
      <Button onClick={handleNext} disabled={!canProceed()}>
        {step === 'message' ? 'Guardar' : 'Siguiente'}
      </Button>
    </Dialog>
  )
}
```

**Step 3: Live Preview**
```tsx
// Vista previa en mockup de celular
<div className="w-[280px] bg-slate-900 rounded-[2.5rem] p-3">
  <div className="bg-white rounded-4xl h-[500px]">
    <div className="bg-emerald-600 p-3">
      {/* Header de WhatsApp */}
    </div>
    <div className="p-4">
      {/* Mensaje renderizado en tiempo real */}
      <p>{formData.mensaje}</p>
    </div>
  </div>
</div>
```

### Chatwoot Sidebar Logic

**File: `app/integrations/chatwoot-sidebar/page.tsx`**

```typescript
"use client"

function ChatwootSidebarContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [client, setClient] = useState<Client | null>(null)
  
  useEffect(() => {
    if (email) {
      // Buscar en clientsData
      const found = clientsData.find(
        c => c.email?.toLowerCase() === email.toLowerCase()
      )
      setClient(found || null)
    }
  }, [email])
  
  if (!client) {
    return <EmptyState />  // "Cliente no registrado"
  }
  
  return (
    <div className="p-4 space-y-4">
      {/* Header compacto */}
      <ClientHeader client={client} />
      
      {/* KPI Grid mini */}
      <div className="grid grid-cols-2 gap-2">
        <KPI label="Terminales" value={client.terminalsCount} />
        <KPI label="Deuda" value="$0" />
      </div>
      
      {/* Botón "Ver en VenePOS" abre en _blank */}
      <Button onClick={() => window.open(`/clients?id=${client.id}`, "_blank")}>
        Ver en VenePOS
      </Button>
    </div>
  )
}

// Wrapper con Suspense (requerido para useSearchParams)
export default function ChatwootSidebarPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChatwootSidebarContent />
    </Suspense>
  )
}
```

**Integración en Chatwoot:**
```html
<!-- En Chatwoot Admin Panel → Settings → Custom Attributes -->
<iframe
  src="https://venepos.com/integrations/chatwoot-sidebar?email={{contact.email}}"
  width="300px"
  height="100%"
  frameborder="0"
></iframe>
```

### File Upload with Drag & Drop

**File: `components/venepos/import/file-upload.tsx`**

```typescript
type UploadState = 'idle' | 'dragging' | 'uploading' | 'complete' | 'error'

export function FileUpload({ onUploadComplete }: Props) {
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  
  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setState('dragging')
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    
    // Validar extensión
    const validExts = ['.xlsx', '.xls', '.csv']
    const ext = file.name.substring(file.name.lastIndexOf('.'))
    
    if (!validExts.includes(ext)) {
      setState('error')
      return
    }
    
    // Simular upload con progress
    setState('uploading')
    let prog = 0
    const interval = setInterval(() => {
      prog += 10
      setProgress(prog)
      if (prog >= 100) {
        clearInterval(interval)
        setState('complete')
        onUploadComplete({ fileName: file.name, recordCount: 245 })
      }
    }, 200)
  }
  
  // Render según estado
  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-xl",
        state === 'dragging' && "border-indigo-500 bg-indigo-50",
        state === 'complete' && "border-emerald-500 bg-emerald-50"
      )}
    >
      {state === 'idle' && <IdleUI />}
      {state === 'uploading' && <ProgressBar value={progress} />}
      {state === 'complete' && <SuccessUI />}
      {state === 'error' && <ErrorUI />}
    </div>
  )
}
```

---

## 7. Performance Optimizations

### Code Splitting

**Automatic with Next.js:**
```tsx
// ❌ NO hacer esto (importa todo el wizard siempre)
import { CampaignWizard } from '@/components/venepos/campaigns/campaign-wizard'

// ✅ MEJOR: Dynamic import (solo carga cuando se abre)
import dynamic from 'next/dynamic'

const CampaignWizard = dynamic(
  () => import('@/components/venepos/campaigns/campaign-wizard'),
  { loading: () => <Spinner /> }
)
```

### Image Optimization

```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  width={200}
  height={50}
  alt="VenePOS"
  priority  // Para above-the-fold
/>
```

### Font Optimization

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',  // FOUT over FOIT
})

export default function RootLayout({ children }) {
  return (
    <html className={inter.variable}>
      {children}
    </html>
  )
}
```

### React Compiler (Ready for React 19)

```javascript
// next.config.js
module.exports = {
  experimental: {
    reactCompiler: true  // Auto-memoization
  }
}
```

---

## 8. Migration Path to Backend

### Phase 2 Checklist

**1. Setup Supabase:**
```bash
npx supabase init
npx supabase start
npx supabase migration new initial_schema
```

**2. Environment Variables:**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx (server-side only)
```

**3. Replace Mock Data:**
```typescript
// Antes (Phase 1)
import { clientsData } from '@/lib/data'
const clients = clientsData

// Después (Phase 2)
import { getClients } from '@/lib/supabase/queries'
const clients = await getClients()  // Server Component
```

**4. API Routes (para mutations):**
```typescript
// app/api/clients/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  const { data, error } = await supabase
    .from('clients')
    .insert(body)
  
  return Response.json({ data, error })
}
```

**5. Real-time Subscriptions:**
```typescript
"use client"

useEffect(() => {
  const channel = supabase
    .channel('campaigns')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'campaigns'
    }, payload => {
      console.log('Campaign updated:', payload)
      // Update UI
    })
    .subscribe()
  
  return () => { supabase.removeChannel(channel) }
}, [])
```

### Testing Strategy

**Unit Tests (Vitest):**
```typescript
// components/__tests__/data-table.test.tsx
import { render } from '@testing-library/react'
import { DataTable } from '../data-table'

test('renders table with data', () => {
  const { getByText } = render(
    <DataTable columns={columns} data={mockData} />
  )
  expect(getByText('Client Name')).toBeInTheDocument()
})
```

**E2E Tests (Playwright):**
```typescript
// e2e/campaigns.spec.ts
test('create campaign via wizard', async ({ page }) => {
  await page.goto('/campaigns?new=true')
  await page.fill('[name="nombre"]', 'Test Campaign')
  await page.click('button:has-text("Siguiente")')
  // ...
  await page.click('button:has-text("Guardar")')
  await expect(page.locator('.toast')).toHaveText('Campaña creada')
})
```

---

## 9. Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

**Environment Variables en Vercel:**
- Settings → Environment Variables
- Agregar `NEXT_PUBLIC_SUPABASE_URL`, etc.

### Docker (Alternative)

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## 10. Security Considerations

### Row Level Security (Supabase)

```sql
-- Solo ver clientes de tu organización
create policy "org_isolation"
  on clients for all
  using (org_id = (select org_id from users where id = auth.uid()));
```

### API Routes Protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

### Input Sanitization

```typescript
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email().optional(),
  rif: z.string().regex(/^[VJE]-\d{8}-\d$/)
})

// Validar antes de guardar
const validated = clientSchema.parse(formData)
```

---

## 11. Appendix: Useful Commands

```bash
# Development
pnpm dev                    # Start dev server (Turbopack)
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
pnpm type-check             # TypeScript check

# Database (Supabase)
npx supabase start          # Start local Supabase
npx supabase db reset       # Reset DB
npx supabase gen types typescript --local > types/supabase.ts

# Testing
pnpm test                   # Run unit tests
pnpm test:e2e               # Run E2E tests
pnpm test:coverage          # Coverage report
```

---

**Document Version:** 1.0  
**Last Updated:** November 23, 2025  
**Author:** VenePOS Engineering Team
