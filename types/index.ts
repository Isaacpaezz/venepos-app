// Tipos de Navegación
export type Route = 'dashboard' | 'clients' | 'campaigns' | 'campaigns-new' | 'import' | 'settings' | 'profile' | 'chatwoot-embed' | 'login' | 'register' | 'onboarding';

// Tipos Generales
export interface User {
  name: string;
  role: string;
  avatar: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'viewer';
  status: 'active' | 'invited' | 'disabled';
  avatar?: string;
  lastActive?: string;
}

// --- MODELO EXACTO BASADO EN EXCEL OPERATIVO ---

export interface Client {
  // Identificadores
  id: string; // ID interno del sistema
  afipos: number; // Columna A
  codigoAfiliado: string; // Columna C
  rif: string; // Columna E

  // Datos del Afiliado
  name: string; // Columna D (NOMBRE_AFILIADO)
  personaContacto: string; // Columna G
  telefono: string; // Columna F
  direccion: string; // Columna H
  email?: string; // No está en excel, pero necesario para CRM

  // Ubicación y Segmentación
  banco: string; // Columna I (NOMBRE_BANCO)
  region: string; // Columna J
  estado: string; // Columna K (Geográfico)
  ciudad: string; // Columna L
  sector: string; // Columna M
  categoriaComercio: string; // Columna N

  // Métricas Agregadas (Calculadas de las filas de terminales)
  terminalsCount: number; // Suma de Columna B (NUMPOS)
  
  // Estados Operativos (Basados en Columna T y W)
  rango: string; // Columna T (Ej: "SIN TX EN EL MES ACTUAL", "30 DIAS SIN TX")
  gestion: string; // Columna W (Ej: "POR GESTIONAR", "ILOCALIZABLE")
  
  // Datos Auxiliares
  initials: string; // Para Avatar
}

export interface Terminal {
  id: string;
  clientId: string; // Link al cliente
  
  // Hardware y Red
  marca: string; // Columna O
  modelo: string; // Columna P
  serial: string; // Columna Q
  operadora: string; // Columna R
  modeloDetalle: string; // Columna U
  
  // Estado
  estadoPos: string; // Columna S (Ej: INSTALADO)
  rango: string; // Columna T (Transaccionalidad)
  
  // Gestión
  responsable: string; // Columna V
  gestion: string; // Columna W
  observacion: string; // Columna X
  fecha: string; // Columna Y
}

export interface KPI {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  isUp: boolean;
}

export interface Activity {
  id: string;
  type: 'payment' | 'alert' | 'system';
  title: string;
  description: string;
  time: string;
  amount?: string;
}

// Campañas (Kanban & Wizard & Detail)
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed';

export interface CampaignStats {
  sent: number;
  delivered: number;
  read: number;
  replied: number;
}

export interface Campaign {
  id: string;
  nombre: string; // Título de la campaña
  estado: CampaignStatus; // draft, scheduled, sending, sent, completed
  audiencia: number; // Cantidad de clientes
  fechaEjecucion: string; // Fecha de ejecución
  horaEjecucion?: string; // Hora de ejecución (opcional)
  canal: string; // Email, SMS, Call, Push, Banner
  progreso?: number; // 0-100 (para campañas en envío)
  estadisticas?: {
    enviados: number;
    respondidos: number;
  };
  // Propiedades legacy (mantener compatibilidad)
  title?: string;
  status?: CampaignStatus;
  audience?: number;
  date?: string;
  progress?: number;
  tags?: string[];
  stats?: CampaignStats;
}

export interface CampaignMember {
  id: string;
  name: string;
  phone: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  lastUpdate: string;
}

export interface CampaignWizardData {
  name: string;
  channel: 'whatsapp_business' | 'sms' | 'email';
  // Audience Filters
  bankFilter: string;
  inactivityDays: string;
  regionFilter: string;
  // Message
  message: string;
}

// Settings
export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}
