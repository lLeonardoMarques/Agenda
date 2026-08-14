import {
  Appointment,
  FinancialReport,
  Professional,
  RecurringClientPackage,
  ServiceItem,
} from '../types';

export const addMonthsToDate = (dateStr: string, months: number): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const targetDate = new Date(year, month + months, day);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  } catch (e) {
    const now = new Date();
    now.setMonth(now.getMonth() + months);
    return now.toISOString().split('T')[0];
  }
};

export const WEEKDAYS_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export interface RecurringDateItem {
  date: string; // YYYY-MM-DD
  sessionNumber: number;
  totalSessions: number;
  weekdayName: string;
  formattedDate: string;
  monthName: string;
  monthIndex: number;
  year: number;
}

/**
 * Gera a lista completa de datas para todos os meses selecionados
 * conforme a frequência escolhida (semanal todo sábado, quinzenal, mensal, etc.)
 */
export function generateRecurringScheduleDates({
  startDate,
  frequency = 'weekly',
  durationMonths = 3,
  customDays = [],
  maxSessions,
}: {
  startDate: string;
  frequency: 'weekly' | 'biweekly' | 'monthly_date' | 'custom_days' | string;
  durationMonths: number;
  customDays?: number[]; // 0..6
  maxSessions?: number;
}): RecurringDateItem[] {
  const resultDates: string[] = [];
  const startParts = startDate.split('-').map(Number);
  const startObj = new Date(startParts[0], startParts[1] - 1, startParts[2]);

  // Data de término no final dos N meses
  const endParts = addMonthsToDate(startDate, durationMonths).split('-').map(Number);
  const endObj = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  if (frequency === 'monthly_date') {
    // 1 vez por mês na mesma data (ou dia mais próximo se o mês tiver menos dias)
    const targetDay = startObj.getDate();
    for (let m = 0; m < durationMonths; m++) {
      const curYear = startParts[0] + Math.floor((startParts[1] - 1 + m) / 12);
      const curMonth = (startParts[1] - 1 + m) % 12;
      const daysInTargetMonth = new Date(curYear, curMonth + 1, 0).getDate();
      const actualDay = Math.min(targetDay, daysInTargetMonth);
      
      const padM = String(curMonth + 1).padStart(2, '0');
      const padD = String(actualDay).padStart(2, '0');
      resultDates.push(`${curYear}-${padM}-${padD}`);
      if (maxSessions && resultDates.length >= maxSessions) break;
    }
  } else if (frequency === 'custom_days' && customDays.length > 0) {
    // Dias específicos da semana (ex: Terça e Quinta)
    const current = new Date(startObj);
    while (current <= endObj) {
      if (customDays.includes(current.getDay())) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        resultDates.push(`${y}-${m}-${d}`);
        if (maxSessions && resultDates.length >= maxSessions) break;
      }
      current.setDate(current.getDate() + 1);
    }
  } else {
    // Semanal (+7 dias) ou Quinzenal (+14 dias)
    const stepDays = frequency === 'biweekly' ? 14 : 7;
    const current = new Date(startObj);

    while (current <= endObj) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      resultDates.push(`${y}-${m}-${d}`);
      if (maxSessions && resultDates.length >= maxSessions) break;

      current.setDate(current.getDate() + stepDays);
    }
  }

  // Garantir que a data inicial esteja presente se a lista estiver vazia
  if (resultDates.length === 0) {
    resultDates.push(startDate);
  }

  const total = resultDates.length;

  return resultDates.map((dStr, idx) => {
    const p = dStr.split('-').map(Number);
    const dt = new Date(p[0], p[1] - 1, p[2]);
    const weekdayName = WEEKDAYS_PT[dt.getDay()];
    const monthName = MONTHS_PT[dt.getMonth()];
    const formattedDate = `${String(p[2]).padStart(2, '0')}/${String(p[1]).padStart(2, '0')}/${p[0]}`;

    return {
      date: dStr,
      sessionNumber: idx + 1,
      totalSessions: total,
      weekdayName,
      formattedDate,
      monthName,
      monthIndex: dt.getMonth(),
      year: dt.getFullYear(),
    };
  });
}

export const PRESET_SALON_SERVICES = [
  {
    name: 'Progressiva Orgânica sem Formol',
    category: 'Química',
    defaultPrice: 280,
    durationMinutes: 150,
    description: 'Alisamento 100% livre de formol com brilho espelhado e alinhamento duradouro.',
  },
  {
    name: 'Corte Feminino & Finalização',
    category: 'Corte',
    defaultPrice: 120,
    durationMinutes: 60,
    description: 'Corte visagista personalizado com lavagem especial e escova modelada.',
  },
  {
    name: 'Botox Capilar / Alinhamento',
    category: 'Química',
    defaultPrice: 220,
    durationMinutes: 120,
    description: 'Redução de volume e frizz com reposição de massa capilar e aminoácidos.',
  },
  {
    name: 'Hidratação Profunda / Nutrição',
    category: 'Tratamento',
    defaultPrice: 140,
    durationMinutes: 60,
    description: 'Tratamento intensivo com máscara e ampolas para recuperação hídrica e brilho.',
  },
  {
    name: 'Cronograma Capilar (4 Sessões)',
    category: 'Tratamento',
    defaultPrice: 380,
    durationMinutes: 75,
    description: 'Ciclo completo de Hidratação, Nutrição e Reconstrução para cabelos fragilizados.',
  },
  {
    name: 'Mechas / Luzes & Tonalização',
    category: 'Coloração',
    defaultPrice: 380,
    durationMinutes: 180,
    description: 'Técnica de iluminação personalizada com proteção Plex e matização.',
  },
  {
    name: 'Coloração / Retoque de Raiz',
    category: 'Coloração',
    defaultPrice: 160,
    durationMinutes: 90,
    description: 'Aplicação de tintura profissional com tratamento pós-química.',
  },
  {
    name: 'Escova Modelada & Tratamento',
    category: 'Finalização',
    defaultPrice: 85,
    durationMinutes: 45,
    description: 'Lavagem com massagem capilar e escova de alta fixação e brilho.',
  },
  {
    name: 'Cauterização / Reconstrução Capilar',
    category: 'Tratamento',
    defaultPrice: 190,
    durationMinutes: 90,
    description: 'Reconstrução com queratina pura e selagem térmica das cutículas.',
  },
];

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || (data && data.success === false)) {
    throw new Error(data?.error || `Erro na requisição: ${res.statusText}`);
  }
  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Status do Servidor e Banco MongoDB Atlas
  getStatus: async () => {
    const res = await fetch('/api/status');
    return handleResponse<any>(res);
  },

  // Agendamentos
  getAppointments: async (params?: {
    date?: string;
    status?: string | string[];
    professional?: string;
    search?: string;
    month?: number;
    year?: number;
  }): Promise<Appointment[]> => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.status && params.status !== 'Todos') {
      if (Array.isArray(params.status)) {
        params.status.forEach((s) => query.append('status', s));
      } else {
        query.set('status', params.status);
      }
    }
    if (params?.professional && params.professional !== 'Todos') {
      query.set('professional', params.professional);
    }
    if (params?.search) query.set('search', params.search);
    if (params?.month) query.set('month', String(params.month));
    if (params?.year) query.set('year', String(params.year));

    const res = await fetch(`/api/appointments?${query.toString()}`);
    return handleResponse<Appointment[]>(res);
  },

  // Histórico
  getHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    professional?: string;
    procedure?: string;
    search?: string;
    status?: string;
  }): Promise<Appointment[]> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.professional && params.professional !== 'Todos') {
      query.set('professional', params.professional);
    }
    if (params?.procedure && params.procedure !== 'Todos') {
      query.set('procedure', params.procedure);
    }
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'Todos') {
      query.set('status', params.status);
    }

    const res = await fetch(`/api/appointments/history?${query.toString()}`);
    return handleResponse<Appointment[]>(res);
  },

  createAppointment: async (data: Partial<Appointment>): Promise<Appointment> => {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Appointment>(res);
  },

  // Criar múltiplos agendamentos em lote (para todos os meses selecionados)
  createBatchAppointments: async (params: {
    appointments: Partial<Appointment>[];
    createPackage?: boolean;
    packageData?: Partial<RecurringClientPackage>;
  }): Promise<{ success: boolean; data: Appointment[]; count: number; package?: any; message: string }> => {
    const res = await fetch('/api/appointments/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<any>(res);
  },

  // Buscar todas as sessões de um grupo recorrente
  getRecurringGroup: async (groupId: string): Promise<Appointment[]> => {
    const res = await fetch(`/api/appointments/recurring-group/${groupId}`);
    return handleResponse<Appointment[]>(res);
  },

  // Excluir todas as sessões de um grupo recorrente
  deleteRecurringGroup: async (groupId: string): Promise<{ success: boolean; deletedCount: number; message: string }> => {
    const res = await fetch(`/api/appointments/recurring-group/${groupId}`, {
      method: 'DELETE',
    });
    return handleResponse<any>(res);
  },

  updateAppointment: async (
    id: string,
    data: Partial<Appointment>
  ): Promise<Appointment> => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Appointment>(res);
  },

  deleteAppointment: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Relatórios Financeiros (Chart.js)
  getFinancialReport: async (params: {
    granularity?: 'year' | 'month' | 'day';
    year?: number;
    month?: number;
    day?: number;
    professional?: string;
  }): Promise<FinancialReport> => {
    const query = new URLSearchParams();
    if (params.granularity) query.set('granularity', params.granularity);
    if (params.year) query.set('year', String(params.year));
    if (params.month !== undefined) query.set('month', String(params.month));
    if (params.day !== undefined) query.set('day', String(params.day));
    if (params.professional && params.professional !== 'Todos') {
      query.set('professional', params.professional);
    }

    const res = await fetch(`/api/appointments/financial?${query.toString()}`);
    return handleResponse<FinancialReport>(res);
  },

  // Serviços
  getServices: async (params?: { category?: string; active?: boolean }): Promise<ServiceItem[]> => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.active !== undefined) query.set('active', String(params.active));

    const res = await fetch(`/api/services?${query.toString()}`);
    return handleResponse<ServiceItem[]>(res);
  },

  createService: async (service: Partial<ServiceItem>): Promise<ServiceItem> => {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    return handleResponse<ServiceItem>(res);
  },

  updateService: async (id: string, service: Partial<ServiceItem>): Promise<ServiceItem> => {
    const res = await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    return handleResponse<ServiceItem>(res);
  },

  deleteService: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Profissionais
  getProfessionals: async (params?: { active?: boolean }): Promise<Professional[]> => {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.set('active', String(params.active));

    const res = await fetch(`/api/professionals?${query.toString()}`);
    return handleResponse<Professional[]>(res);
  },

  createProfessional: async (prof: Partial<Professional>): Promise<Professional> => {
    const res = await fetch('/api/professionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prof),
    });
    return handleResponse<Professional>(res);
  },

  updateProfessional: async (
    id: string,
    prof: Partial<Professional>
  ): Promise<Professional> => {
    const res = await fetch(`/api/professionals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prof),
    });
    return handleResponse<Professional>(res);
  },

  deleteProfessional: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/professionals/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Clientes Recorrentes & Pacotes
  getRecurringPackages: async (): Promise<RecurringClientPackage[]> => {
    const res = await fetch('/api/recurring-packages');
    return handleResponse<RecurringClientPackage[]>(res);
  },

  createRecurringPackage: async (
    pkg: Partial<RecurringClientPackage>
  ): Promise<RecurringClientPackage> => {
    const res = await fetch('/api/recurring-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    return handleResponse<RecurringClientPackage>(res);
  },

  updateRecurringPackage: async (
    id: string,
    pkg: Partial<RecurringClientPackage>
  ): Promise<RecurringClientPackage> => {
    const res = await fetch(`/api/recurring-packages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    return handleResponse<RecurringClientPackage>(res);
  },

  usePackageSession: async (id: string): Promise<RecurringClientPackage> => {
    // Fetch package, increment used sessions
    const pkgs = await api.getRecurringPackages();
    const target = pkgs.find((p) => p._id === id);
    if (!target) throw new Error('Pacote não encontrado');

    const newUsed = Math.min(target.usedSessions + 1, target.totalSessions);
    const newStatus = newUsed >= target.totalSessions ? 'Concluído' : target.status;

    return api.updateRecurringPackage(id, {
      usedSessions: newUsed,
      status: newStatus as any,
    });
  },

  deleteRecurringPackage: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/recurring-packages/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Documentação da API
  getApiDocs: async () => {
    return {
      appName: 'Toque da Beleza - API REST',
      version: '1.0.0',
      database: {
        type: 'MongoDB Atlas',
        cluster: 'Cluster0',
        dbName: 'flavia_salao',
        uriPattern:
          'mongodb+srv://dev:dev123@cluster0.oflxvxo.mongodb.net/flavia_salao?retryWrites=true&w=majority&appName=Cluster0',
      },
      endpoints: [
        {
          method: 'GET',
          path: '/api/status',
          category: 'Sistema',
          description:
            'Verifica saúde do sistema, conexão com MongoDB Atlas flavia_salao e contadores ativos.',
        },
        {
          method: 'GET',
          path: '/api/appointments',
          category: 'Agendamentos',
          description:
            'Lista clientes agendadas com filtros por data, status, mês, profissional e busca por nome/telefone.',
        },
        {
          method: 'POST',
          path: '/api/appointments',
          category: 'Agendamentos',
          description: 'Cria um novo agendamento de cliente diretamente no MongoDB.',
        },
        {
          method: 'PUT',
          path: '/api/appointments/:id',
          category: 'Agendamentos',
          description:
            'Atualiza status (Agendado, Em Atendimento, Concluído, Cancelado), pagamento e observações.',
        },
        {
          method: 'DELETE',
          path: '/api/appointments/:id',
          category: 'Agendamentos',
          description: 'Exclui um agendamento do banco de dados.',
        },
        {
          method: 'GET',
          path: '/api/appointments/history',
          category: 'Histórico',
          description:
            'Histórico completo de atendimentos com filtros por período de datas, profissional e procedimento.',
        },
        {
          method: 'GET',
          path: '/api/appointments/financial',
          category: 'Relatórios & Chart.js',
          description:
            'Gera consolidação financeira por ano, mês ou dia e profissional, com dados prontos para gráficos Chart.js.',
        },
        {
          method: 'GET',
          path: '/api/services',
          category: 'Serviços',
          description: 'Lista o catálogo de procedimentos e serviços oferecidos.',
        },
        {
          method: 'POST',
          path: '/api/services',
          category: 'Serviços',
          description: 'Cadastra um novo serviço no salão.',
        },
        {
          method: 'GET',
          path: '/api/professionals',
          category: 'Profissionais',
          description: 'Lista a equipe de cabeleireiras e especialistas.',
        },
        {
          method: 'GET',
          path: '/api/recurring-packages',
          category: 'Clientes Recorrentes',
          description: 'Lista os pacotes mensais e clientes com mensalidades ativas.',
        },
      ],
    };
  },
};

export default api;
