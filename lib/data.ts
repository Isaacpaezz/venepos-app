import { Client, Activity, Campaign, NotificationSetting, Terminal, TeamMember, CampaignMember } from '@/types';

// Datos basados en la estructura del Excel proporcionado
export const clientsData: Client[] = [
  { 
    id: '1', 
    afipos: 799922831,
    codigoAfiliado: '79992283',
    name: 'RAMON IGNACIO ABREU DELGADO', 
    rif: 'V-043258768',
    personaContacto: 'RAMON IGNACIO ABREU DELGADO',
    telefono: '2714147116',
    direccion: 'CALLE PRINCIPAL',
    email: 'ramon.abreu@gmail.com', // Simulado
    banco: 'BANPLUS',
    region: 'SUR-OCCIDENTE',
    estado: 'Trujillo',
    ciudad: 'LA QUEBRADA',
    sector: 'GENERICO',
    categoriaComercio: 'COMIDAS RAPIDAS FTE SODAS',
    terminalsCount: 1,
    rango: 'SIN TX EN EL MES ACTUAL',
    gestion: 'POR GESTIONAR',
    initials: 'RA'
  },
  { 
    id: '2', 
    afipos: 721252401,
    codigoAfiliado: '72125240',
    name: 'LUISRAIDY GERALDIN ACURERO VA', 
    rif: 'V-189285309',
    personaContacto: 'ACURERO VASQUEZ LUISRAIDY GERA',
    telefono: '2563361534',
    direccion: 'AV 3 ENTRE CALLEJON 16 LOCAL N',
    email: 'luisraidy.a@hotmail.com',
    banco: 'BANCO DEL CARIBE',
    region: 'CENTRO LLANOS',
    estado: 'Portuguesa',
    ciudad: 'VILLA BRUZUAL',
    sector: 'GENERICO',
    categoriaComercio: 'SUPERMERCADOS ABASTOS',
    terminalsCount: 1,
    rango: 'SIN TX EN EL MES ACTUAL',
    gestion: 'POR GESTIONAR',
    initials: 'LA'
  },
  { 
    id: '3', 
    afipos: 852198472,
    codigoAfiliado: '85219847',
    name: 'CARLA FABIOLA GUTIERREZ GUANI', 
    rif: 'V-206222537',
    personaContacto: 'CARLA FABIOLA GUTIERREZ',
    telefono: '4246389711',
    direccion: 'CALLE SAN MARTIN LOCAL SIN NUM',
    email: 'carla.gutierrez@yahoo.com',
    banco: 'BANCO DE VENEZUELA',
    region: 'NOR-OCCIDENTE',
    estado: 'Zulia',
    ciudad: 'CABIMAS',
    sector: 'GENERICO',
    categoriaComercio: 'SUPERMERCADOS ABASTOS',
    terminalsCount: 2,
    rango: '30 DIAS SIN TX',
    gestion: 'ILOCALIZABLE',
    initials: 'CG'
  },
  { 
    id: '4', 
    afipos: 834772452,
    codigoAfiliado: '83477245',
    name: 'FERRETERIA ALPECA CA', 
    rif: 'J-407012231',
    personaContacto: 'VILLALOBOS MELENDEZ RAIDA',
    telefono: '4246044513',
    direccion: 'AV 4 CON CALL 67 CC COSTA',
    email: 'ferreteria.alpeca@gmail.com',
    banco: 'ACTIVO',
    region: 'NOR-OCCIDENTE',
    estado: 'Zulia',
    ciudad: 'MARACAIBO',
    sector: 'N1 18 DE OCTUBRE',
    categoriaComercio: 'FERRETERIAS',
    terminalsCount: 2,
    rango: '120 DIAS SIN TX',
    gestion: 'EQUIPO EN TALLER',
    initials: 'FA'
  },
  { 
    id: '5', 
    afipos: 858730161,
    codigoAfiliado: '85873016',
    name: 'PISTACHOS SC CA', 
    rif: 'J-504561266',
    personaContacto: 'TORRES CARRERO FRANCHESKA',
    telefono: '4145693212',
    direccion: 'LA CARRERA 20',
    email: 'pistachos.sc@gmail.com',
    banco: '501-BICENTENARIO',
    region: 'SUR-OCCIDENTE',
    estado: 'Táchira',
    ciudad: 'SAN CRISTOBAL',
    sector: 'GENERICO',
    categoriaComercio: 'PANADERIA PASTELERIA',
    terminalsCount: 1,
    rango: 'SIN TX EN EL MES ACTUAL',
    gestion: 'POR GESTIONAR',
    initials: 'PS'
  },
  { 
    id: '6', 
    afipos: 784591662,
    codigoAfiliado: '78459166',
    name: 'AUVERT HERNANDEZ JENJAY', 
    rif: 'V-166883128',
    personaContacto: 'AUVERT HERNANDEZ JENJAY',
    telefono: '4146550544',
    direccion: 'CL 4 CASA SN',
    email: 'auvert.h@gmail.com',
    banco: 'BANCO DE VENEZUELA',
    region: 'NOR-OCCIDENTE',
    estado: 'Zulia',
    ciudad: 'MARACAIBO',
    sector: 'GENERICO',
    categoriaComercio: 'SUPERMERCADOS ABASTOS',
    terminalsCount: 2,
    rango: 'SIN TX EN EL MES ACTUAL',
    gestion: 'CONTACTAR DE NUEVO',
    initials: 'AH'
  }
];

export const mockTerminals: Terminal[] = [
  { 
    id: 't1', clientId: '1', 
    marca: 'PAX', modelo: 'S920', serial: '6K591348', 
    operadora: 'MOVILNET', estadoPos: 'INSTALADO', rango: 'SIN TX EN EL MES ACTUAL', 
    modeloDetalle: 'PAX S920 (GPRS) CREDIPOS', responsable: 'VENEPOS', gestion: 'POR GESTIONAR', 
    observacion: '', fecha: '2025-11-20'
  },
  { 
    id: 't2', clientId: '2', 
    marca: 'NEXGO', modelo: 'N3', serial: 'N300W156249', 
    operadora: 'DIGITEL', estadoPos: 'INSTALADO', rango: 'SIN TX EN EL MES ACTUAL', 
    modeloDetalle: 'NEXGO N3 (GPRS) CREDIPOS', responsable: 'VENEPOS', gestion: 'POR GESTIONAR', 
    observacion: '', fecha: '2025-11-19'
  },
  { 
    id: 't3', clientId: '3', 
    marca: 'TOPWISE', modelo: 'T1', serial: 'P051000111579', 
    operadora: 'N/D', estadoPos: 'INSTALADO', rango: '30 DIAS SIN TX', 
    modeloDetalle: 'TOPWISE T1 GPRS CREDIPOS', responsable: 'VENEPOS', gestion: 'ILOCALIZABLE', 
    observacion: 'Cliente no contesta llamadas', fecha: '2025-11-18'
  },
  { 
    id: 't4', clientId: '4', 
    marca: 'PAX', modelo: 'A920', serial: '822952844', 
    operadora: 'DIGITEL', estadoPos: 'INSTALADO', rango: '120 DIAS SIN TX', 
    modeloDetalle: 'PAX A920 (GPRS/WIFI) CREDIPOS', responsable: 'VENEPOS', gestion: 'EQUIPO EN TALLER', 
    observacion: 'Falla de batería reportada', fecha: '2025-11-15'
  },
  { 
    id: 't5', clientId: '4', 
    marca: 'PAX', modelo: 'A50', serial: '1700522662', 
    operadora: 'DIGITEL', estadoPos: 'INSTALADO', rango: '30 DIAS SIN TX', 
    modeloDetalle: 'PAX A50 (GPRS/WIFI) CREDIPOS', responsable: 'VENEPOS', gestion: 'POR GESTIONAR', 
    observacion: '', fecha: '2025-11-20'
  },
  { 
    id: 't6', clientId: '5', 
    marca: 'TOPWISE', modelo: 'T1', serial: 'P051000123714', 
    operadora: 'N/D', estadoPos: 'INSTALADO', rango: 'SIN TX EN EL MES ACTUAL', 
    modeloDetalle: 'TOPWISE T1 GPRS CREDIPOS', responsable: 'VENEPOS', gestion: 'POR GESTIONAR', 
    observacion: '', fecha: '2025-11-20'
  }
];

export const dashboardActivities: Activity[] = [
  { id: '1', type: 'payment', title: 'Pago Recibido', description: 'FERRETERIA ALPECA CA liquidó saldo pendiente.', time: 'Hace 2h', amount: '$1,250.00' },
  { id: '2', type: 'system', title: 'Campaña Finalizada', description: 'Campaña "Recuperación Zulia" completada.', time: 'Hace 4h' },
  { id: '3', type: 'alert', title: 'Riesgo Detectado', description: 'Terminal #822952844 sin transacciones > 120 días.', time: 'Hace 6h' },
  { id: '4', type: 'payment', title: 'Promesa de Pago', description: 'PISTACHOS SC CA agendó pago.', time: 'Hace 8h', amount: '$450.00' }
];

export const chartData = [
  { name: 'Lun', sent: 120, replied: 45, recovered: 18 },
  { name: 'Mar', sent: 132, replied: 52, recovered: 24 },
  { name: 'Mie', sent: 101, replied: 38, recovered: 15 },
  { name: 'Jue', sent: 154, replied: 65, recovered: 32 },
  { name: 'Vie', sent: 90, replied: 40, recovered: 28 },
  { name: 'Sab', sent: 60, replied: 25, recovered: 12 },
  { name: 'Dom', sent: 40, replied: 15, recovered: 8 },
];

export const campaignsData: Campaign[] = [
  {
    id: 'c1',
    nombre: 'Recuperación Zulia Noviembre',
    estado: 'draft',
    audiencia: 150,
    fechaEjecucion: '2025-11-25',
    canal: 'Email',
  },
  {
    id: 'c2',
    nombre: 'Bienvenida Nuevos Afiliados',
    estado: 'scheduled',
    audiencia: 12,
    fechaEjecucion: '2025-11-21',
    canal: 'Email',
  },
  {
    id: 'c3',
    nombre: 'Aviso Mantenimiento BOD',
    estado: 'sending',
    audiencia: 1200,
    fechaEjecucion: '2025-11-22',
    horaEjecucion: '10:00 AM',
    canal: 'Push',
    progreso: 45,
  },
  {
    id: 'c4',
    nombre: 'Campaña Inactivos > 60 días',
    estado: 'completed',
    audiencia: 850,
    fechaEjecucion: '2025-11-15',
    canal: 'Email',
    estadisticas: {
      enviados: 850,
      respondidos: 145,
    },
  },
  {
    id: 'c5',
    nombre: 'Encuesta Satisfacción',
    estado: 'draft',
    audiencia: 45,
    fechaEjecucion: '2025-11-30',
    canal: 'Call',
  },
  {
    id: 'c6',
    nombre: 'Campaña Inactivos > 60 días',
    estado: 'completed',
    audiencia: 850,
    fechaEjecucion: '2025-11-15',
    canal: 'Banner',
    estadisticas: {
      enviados: 850,
      respondidos: 145,
    },
  },
];

export const mockCampaignMembers: CampaignMember[] = [
  { id: 'm1', name: 'FERRETERIA ALPECA CA', phone: '+58 414 1234567', status: 'replied', lastUpdate: 'Hace 5 min' },
  { id: 'm2', name: 'PISTACHOS SC CA', phone: '+58 412 9876543', status: 'read', lastUpdate: 'Hace 1 hora' },
  { id: 'm3', name: 'AUVERT HERNANDEZ JENJAY', phone: '+58 424 1112233', status: 'delivered', lastUpdate: 'Hace 2 horas' },
  { id: 'm4', name: 'CARLA FABIOLA GUTIERREZ', phone: '+58 416 5556677', status: 'failed', lastUpdate: 'Ayer' },
];

export const mockCampaignAnalytics = [
  { time: '08:00', sent: 50, replies: 2 },
  { time: '10:00', sent: 120, replies: 15 },
  { time: '12:00', sent: 80, replies: 35 },
  { time: '14:00', sent: 40, replies: 20 },
  { time: '16:00', sent: 60, replies: 40 },
  { time: '18:00', sent: 20, replies: 10 },
];

export const notificationSettings: NotificationSetting[] = [
  { id: 'n1', label: 'Pagos Recibidos', description: 'Notificar cuando un cliente realice un pago.', enabled: true },
  { id: 'n2', label: 'Alertas de Riesgo', description: 'Notificar cuando un terminal pase a "SIN TX EN EL MES".', enabled: true },
  { id: 'n3', label: 'Resumen Semanal', description: 'Enviar reporte de rendimiento cada lunes.', enabled: false },
];

export const mockTeamMembers: TeamMember[] = [
  { id: 'u1', name: 'Carlos Ruiz', email: 'admin@credicardpos.com', role: 'admin', status: 'active', avatar: 'CR', lastActive: 'Ahora' },
  { id: 'u2', name: 'Ana Gómez', email: 'ana.gomez@credicardpos.com', role: 'agent', status: 'active', avatar: 'AG', lastActive: 'Hace 2h' },
];
