// src/types.ts - COMPLETO E CORRIGIDO

export type AppointmentStatus = 'Agendado' | 'Em Atendimento' | 'Concluído' | 'Cancelado';
export type PaymentMethod = 'Pendente' | 'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Dinheiro';

export interface Appointment {
  _id: string;
  clientName: string;
  clientPhone: string;
  procedure: string;
  professional: string;
  price: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  isRecurringPackage?: boolean;
  packageName?: string;
  packageDurationMonths?: number;
  packageSessionsTotal?: number;
  packageSessionNumber?: number;
  recurringGroupId?: string;
  recurringFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'custom' | string;
  notes?: string;
  source?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurringClientPackage {
  _id: string;
  clientName: string;
  clientPhone: string;
  packageName: string;
  durationMonths: number; // Ex: 1, 2, 3, 6, 12 meses
  totalSessions: number;
  usedSessions: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  professional: string;
  startDate: string;
  endDate: string;
  notes?: string;
  status: 'Ativo' | 'Concluído' | 'Cancelado';
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceItem {
  _id: string;
  name: string;
  category: string;
  defaultPrice: number;
  durationMinutes: number;
  description?: string;
  isPackage?: boolean;
  packageMonths?: number;
  packageSessions?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Professional {
  _id: string;
  name: string;
  role: string;
  phone?: string;
  color?: string;
  avatar?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type TimeGranularity = 'year' | 'month' | 'day';

export interface TimelineDataPoint {
  key: string;
  label: string;
  secondaryLabel?: string;
  revenue: number;
  count: number;
  growth?: number;
  year?: number;
  month?: number;
  day?: number;
}

export interface FinancialReport {
  period: {
    granularity: TimeGranularity;
    year: number;
    month?: number;
    day?: number;
    professional: string;
    filterDescription?: string;
  };
  metrics: {
    totalRevenue: number;
    totalAppointments: number;
    completedAppointments: number;
    averageTicket: number;
    completionRate: number;
    growthRate?: number; // % growth compared to previous period
    previousRevenue?: number;
    revenueDifference?: number;
  };
  timelineData: TimelineDataPoint[];
  dailyRevenue: {
    date: string;
    day: number;
    revenue: number;
    count: number;
  }[];
  monthlyRevenue?: {
    month: number;
    monthName: string;
    year: number;
    revenue: number;
    count: number;
  }[];
  yearlyRevenue?: {
    year: number;
    revenue: number;
    count: number;
    growth?: number;
  }[];
  procedureStats: {
    procedure: string;
    count: number;
    revenue: number;
    percentage: number;
  }[];
  professionalStats: {
    professional: string;
    count: number;
    revenue: number;
  }[];
  paymentMethodStats: {
    method: PaymentMethod;
    count: number;
    revenue: number;
  }[];
}

export interface ApiEndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  category: string;
  payload?: Record<string, any>;
  responseExample?: Record<string, any>;
}

// ==========================================
// TIPOS ADICIONAIS PARA O BACKEND
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  total?: number;
}

export interface DatabaseStatus {
  connected: boolean;
  cluster: string;
  databaseName: string;
  error?: string | null;
}

export interface ServerStatus {
  status: string;
  database: DatabaseStatus;
  counts: {
    appointments: number;
    services: number;
    professionals: number;
  };
  serverTime: string;
  salon: string;
}

// ==========================================
// TIPOS PARA FILTROS E PARÂMETROS
// ==========================================

export interface AppointmentFilters {
  date?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  professional?: string;
  search?: string;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  procedure?: string;
}

export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  professional?: string;
  procedure?: string;
  search?: string;
  status?: AppointmentStatus;
}

export interface FinancialFilters {
  month: number;
  year: number;
  professional?: string;
}

// ==========================================
// TIPOS PARA CRIAÇÃO/ATUALIZAÇÃO
// ==========================================

export interface CreateAppointmentDTO {
  clientName: string;
  clientPhone: string;
  procedure: string;
  professional?: string;
  price?: number;
  date: string;
  time: string;
  durationMinutes?: number;
  status?: AppointmentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  source?: string;
}

export interface UpdateAppointmentDTO {
  clientName?: string;
  clientPhone?: string;
  procedure?: string;
  professional?: string;
  price?: number;
  date?: string;
  time?: string;
  durationMinutes?: number;
  status?: AppointmentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  source?: string;
  completedAt?: string;
}

export interface CreateServiceDTO {
  name: string;
  category: string;
  defaultPrice: number;
  durationMinutes: number;
  description?: string;
  active?: boolean;
}

export interface UpdateServiceDTO {
  name?: string;
  category?: string;
  defaultPrice?: number;
  durationMinutes?: number;
  description?: string;
  active?: boolean;
}

export interface CreateProfessionalDTO {
  name: string;
  role?: string;
  phone?: string;
  color?: string;
  avatar?: string;
  active?: boolean;
}

export interface UpdateProfessionalDTO {
  name?: string;
  role?: string;
  phone?: string;
  color?: string;
  avatar?: string;
  active?: boolean;
}

// ==========================================
// TIPOS PARA RELATÓRIOS E MÉTRICAS
// ==========================================

export interface DailyRevenue {
  date: string;
  day: number;
  revenue: number;
  count: number;
}

export interface ProcedureStats {
  procedure: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface ProfessionalStats {
  professional: string;
  count: number;
  revenue: number;
}

export interface PaymentMethodStats {
  method: PaymentMethod;
  count: number;
  revenue: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  averageTicket: number;
  completionRate: number;
}

// ==========================================
// TIPOS PARA USUÁRIO E AUTENTICAÇÃO
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  token?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'manager';
}

// ==========================================
// TIPOS PARA CONFIGURAÇÕES DO SISTEMA
// ==========================================

export interface AppConfig {
  salonName: string;
  salonPhone: string;
  salonEmail: string;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: number[]; // 0 = Domingo, 6 = Sábado
  appointmentDuration: number; // minutos
}

// ==========================================
// TIPOS PARA NOTIFICAÇÕES
// ==========================================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  createdAt: string;
}

// ==========================================
// TIPOS PARA O ESTADO GLOBAL DA APLICAÇÃO
// ==========================================

export interface AppState {
  appointments: Appointment[];
  services: ServiceItem[];
  professionals: Professional[];
  selectedDate: string;
  selectedProfessional: string;
  loading: boolean;
  dbStatus: DatabaseStatus | null;
  theme: 'light' | 'dark';
  activeTab: 'agenda' | 'history' | 'reports' | 'services';
  notifications: Notification[];
  user: User | null;
}

// ==========================================
// TIPOS PARA GRÁFICOS (CHART.JS)
// ==========================================

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      position?: 'top' | 'bottom' | 'left' | 'right';
      labels?: {
        font?: {
          size?: number;
          weight?: string;
        };
        color?: string;
      };
    };
    title?: {
      display?: boolean;
      text?: string;
      font?: {
        size?: number;
        weight?: string;
      };
    };
  };
  scales?: {
    x?: {
      grid?: {
        display?: boolean;
      };
      ticks?: {
        color?: string;
      };
    };
    y?: {
      beginAtZero?: boolean;
      grid?: {
        display?: boolean;
      };
      ticks?: {
        color?: string;
        callback?: (value: any) => string;
      };
    };
  };
}

// ==========================================
// TIPOS PARA FORMULÁRIOS
// ==========================================

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea' | 'email' | 'phone';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  value?: any;
  error?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

// ==========================================
// TIPOS PARA COMPONENTES DE MODAL
// ==========================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => Promise<void>;
  initialData?: any;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
}

// ==========================================
// TIPOS PARA WEBHOOK E INTEGRAÇÕES
// ==========================================

export interface WebhookPayload {
  event: 'appointment.created' | 'appointment.updated' | 'appointment.deleted';
  data: Appointment;
  timestamp: string;
  source: string;
}

export interface ExternalBookingPayload {
  clientName: string;
  clientPhone: string;
  procedure: string;
  professional?: string;
  price?: number;
  date: string;
  time: string;
  durationMinutes?: number;
  notes?: string;
  source?: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  appointment?: Appointment;
  error?: string;
}

// ==========================================
// TIPOS PARA CONFIGURAÇÃO DE ROTAS (API)
// ==========================================

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (req: any, res: any) => void;
  middleware?: Array<(req: any, res: any, next: any) => void>;
  validation?: any;
  description?: string;
  tags?: string[];
}

export interface ApiDocsConfig {
  title: string;
  version: string;
  description: string;
  endpoints: ApiEndpointDoc[];
  servers: Array<{
    url: string;
    description?: string;
  }>;
}

// ==========================================
// TIPOS PARA PAGINAÇÃO
// ==========================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==========================================
// TIPOS PARA ERROS
// ==========================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  status?: number;
  timestamp?: string;
}

export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR';

// ==========================================
// TIPOS PARA AGENDAMENTOS (EXTRA)
// ==========================================

export interface TimeSlot {
  time: string;
  available: boolean;
  appointmentId?: string;
  clientName?: string;
  procedure?: string;
}

export interface DaySchedule {
  date: string;
  slots: TimeSlot[];
  totalAppointments: number;
  totalRevenue: number;
}

export interface WeekSchedule {
  weekStart: string;
  weekEnd: string;
  days: DaySchedule[];
  weekTotalAppointments: number;
  weekTotalRevenue: number;
}

// ==========================================
// TIPOS PARA SERVIÇOS E PROFISSIONAIS (EXTRA)
// ==========================================

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  count: number;
}

export interface ProfessionalSchedule {
  professional: Professional;
  appointments: Appointment[];
  totalToday: number;
  totalRevenue: number;
  availability: TimeSlot[];
}

export interface ProfessionalStatsExtended extends ProfessionalStats {
  averageRating?: number;
  totalClients?: number;
  satisfactionRate?: number;
  mostCommonProcedure?: string;
}