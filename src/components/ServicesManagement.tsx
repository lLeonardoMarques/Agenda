import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  User,
  Sparkles,
  Phone,
  Tag,
  Repeat,
  Calendar,
  CheckCircle2,
  Check,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  ChevronDown,
  Layers,
  Sparkle,
  CalendarDays,
  CalendarCheck,
  ArrowRight,
  ChevronUp,
} from 'lucide-react';
import { Appointment, Professional, RecurringClientPackage, ServiceItem } from '../types';
import {
  api,
  PRESET_SALON_SERVICES,
  addMonthsToDate,
  generateRecurringScheduleDates,
  RecurringDateItem,
  WEEKDAYS_PT,
} from '../lib/api';

interface ServicesManagementProps {
  services: ServiceItem[];
  professionals: Professional[];
  recurringPackages?: RecurringClientPackage[];
  onRefreshData: () => void;
  onScheduleClient?: (
    clientName: string,
    clientPhone: string,
    procedure: string,
    professional?: string
  ) => void;
}

export const ServicesManagement: React.FC<ServicesManagementProps> = ({
  services,
  professionals,
  recurringPackages: propPackages,
  onRefreshData,
  onScheduleClient,
}) => {
  // Active sub-section
  const [activeSection, setActiveSection] = useState<'all' | 'services' | 'recurring' | 'team'>('all');

  // Services State
  const [showAddService, setShowAddService] = useState(false);
  const [selectedPresetService, setSelectedPresetService] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Corte');
  const [servicePrice, setServicePrice] = useState<number>(120);
  const [serviceDuration, setServiceDuration] = useState<number>(60);
  const [serviceDescription, setServiceDescription] = useState('');

  // Recurring Packages State
  const [recurringList, setRecurringList] = useState<RecurringClientPackage[]>(propPackages || []);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [recClientName, setRecClientName] = useState('');
  const [recClientPhone, setRecClientPhone] = useState('');
  const [recPackageName, setRecPackageName] = useState('');
  const [recDurationMonths, setRecDurationMonths] = useState<number>(3);
  const [recTotalSessions, setRecTotalSessions] = useState<number>(4);
  const [recTotalPrice, setRecTotalPrice] = useState<number>(380);
  const [recProfessional, setRecProfessional] = useState(professionals[0]?.name || 'Flávia');
  const [recPaymentMethod, setRecPaymentMethod] = useState<any>('Pix');
  const [recNotes, setRecNotes] = useState('');

  // Auto-schedule options
  const [autoScheduleAppointments, setAutoScheduleAppointments] = useState(true);
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recTime, setRecTime] = useState('09:00');
  const [recFrequency, setRecFrequency] = useState<'weekly' | 'biweekly' | 'monthly_date'>('weekly');

  // Viewing package sessions modal
  const [viewingPackage, setViewingPackage] = useState<RecurringClientPackage | null>(null);
  const [packageAppointments, setPackageAppointments] = useState<Appointment[]>([]);
  const [loadingPkgAppts, setLoadingPkgAppts] = useState(false);

  // Preset Packages shortcuts
  const presetPackages = [
    {
      name: 'Pacote Hidratação + Escova Semanal',
      months: 3,
      sessions: 12,
      price: 650,
      notes: 'Hidratações com máscara nutritiva e escovas modeladas semanais.',
    },
    {
      name: 'Cronograma Capilar Completo (4 Sessões)',
      months: 2,
      sessions: 4,
      price: 420,
      notes: 'Etapas de Hidratação, Nutrição, Reconstrução e Botox.',
    },
    {
      name: 'Pacote Manutenção Loiro & Botox',
      months: 6,
      sessions: 6,
      price: 980,
      notes: 'Matização mensal com reposição de massa e aminoácidos.',
    },
    {
      name: 'Pacote Progressiva + Tratamentos Pós-Química',
      months: 4,
      sessions: 4,
      price: 520,
      notes: '1 Aplicação de Progressiva Orgânica + 3 sessões de nutrição.',
    },
  ];

  // Professional form state
  const [showAddProf, setShowAddProf] = useState(false);
  const [profName, setProfName] = useState('');
  const [profRole, setProfRole] = useState('Cabeleireira Especialista');
  const [profPhone, setProfPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync recurring packages
  const loadRecurring = async () => {
    try {
      const pkgs = await api.getRecurringPackages();
      setRecurringList(pkgs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (propPackages && propPackages.length > 0) {
      setRecurringList(propPackages);
    } else {
      loadRecurring();
    }
  }, [propPackages]);

  // Preview generated dates for recurring creation
  const previewScheduleDates = useMemo(() => {
    if (!autoScheduleAppointments || !recStartDate) return [];
    return generateRecurringScheduleDates({
      startDate: recStartDate,
      frequency: recFrequency,
      durationMonths: recDurationMonths,
    });
  }, [autoScheduleAppointments, recStartDate, recFrequency, recDurationMonths]);

  // Update total sessions when preview changes
  useEffect(() => {
    if (autoScheduleAppointments && previewScheduleDates.length > 0) {
      setRecTotalSessions(previewScheduleDates.length);
    }
  }, [autoScheduleAppointments, previewScheduleDates.length]);

  // Handle Preset Service Selection
  const handleSelectPresetService = (name: string) => {
    setSelectedPresetService(name);
    const found = PRESET_SALON_SERVICES.find((p) => p.name === name);
    if (found) {
      setServiceName(found.name);
      setServiceCategory(found.category);
      setServicePrice(found.defaultPrice);
      setServiceDuration(found.durationMinutes);
      setServiceDescription(found.description);
    }
  };

  // Handle Preset Package Selection
  const handleSelectPresetPackage = (pkg: typeof presetPackages[0]) => {
    setRecPackageName(pkg.name);
    setRecDurationMonths(pkg.months);
    setRecTotalSessions(pkg.sessions);
    setRecTotalPrice(pkg.price);
    setRecNotes(pkg.notes);
  };

  // Create Standard Service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    try {
      setSaving(true);
      await api.createService({
        name: serviceName.trim(),
        category: serviceCategory,
        defaultPrice: Number(servicePrice),
        durationMinutes: Number(serviceDuration),
        description: serviceDescription.trim(),
      });
      setShowAddService(false);
      setServiceName('');
      setServiceDescription('');
      setSelectedPresetService('');
      setSuccessMsg('Procedimento cadastrado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
      onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('Deseja realmente remover este serviço do catálogo?')) {
      try {
        await api.deleteService(id);
        onRefreshData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Create Recurring Client Package
  const handleCreateRecurringClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recClientName.trim()) {
      alert('Informe o nome da cliente.');
      return;
    }
    if (!recPackageName.trim()) {
      alert('Escreva o nome ou detalhes do pacote.');
      return;
    }

    try {
      setSaving(true);
      const today = recStartDate || new Date().toISOString().split('T')[0];
      const endDate = addMonthsToDate(today, Number(recDurationMonths) || 1);

      if (autoScheduleAppointments && previewScheduleDates.length > 0) {
        const recurringGroupId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const total = previewScheduleDates.length;
        const pricePerSession = Math.round(Number(recTotalPrice) / total);

        const batchAppts: Partial<Appointment>[] = previewScheduleDates.map((item, idx) => ({
          clientName: recClientName.trim(),
          clientPhone: recClientPhone.trim(),
          procedure: `${recPackageName.trim()}`,
          professional: recProfessional,
          price: pricePerSession,
          date: item.date,
          time: recTime,
          durationMinutes: 60,
          status: 'Agendado',
          paymentMethod: idx === 0 ? recPaymentMethod : 'Pix',
          notes: recNotes.trim()
            ? `${recNotes.trim()} (Sessão ${item.sessionNumber}/${total})`
            : `Sessão ${item.sessionNumber}/${total} do pacote ${recPackageName}`,
          source: 'Agendamento Recorrente',
          isRecurringPackage: true,
          packageName: recPackageName.trim(),
          packageDurationMonths: Number(recDurationMonths),
          packageSessionsTotal: total,
          packageSessionNumber: item.sessionNumber,
          recurringGroupId,
          recurringFrequency: recFrequency,
        }));

        await api.createBatchAppointments({
          appointments: batchAppts,
          createPackage: true,
          packageData: {
            clientName: recClientName.trim(),
            clientPhone: recClientPhone.trim(),
            packageName: recPackageName.trim(),
            durationMonths: Number(recDurationMonths) || 1,
            totalSessions: total,
            usedSessions: 0,
            totalPrice: Number(recTotalPrice) || 0,
            paymentMethod: recPaymentMethod,
            professional: recProfessional,
            startDate: today,
            endDate,
            notes: recNotes.trim(),
            status: 'Ativo',
          },
        });
      } else {
        await api.createRecurringPackage({
          clientName: recClientName.trim(),
          clientPhone: recClientPhone.trim(),
          packageName: recPackageName.trim(),
          durationMonths: Number(recDurationMonths) || 1,
          totalSessions: Number(recTotalSessions) || 4,
          usedSessions: 0,
          totalPrice: Number(recTotalPrice) || 0,
          paymentMethod: recPaymentMethod,
          professional: recProfessional,
          startDate: today,
          endDate,
          notes: recNotes.trim(),
          status: 'Ativo',
        });
      }

      setShowAddRecurring(false);
      setRecClientName('');
      setRecClientPhone('');
      setRecPackageName('');
      setRecNotes('');
      setSuccessMsg(
        autoScheduleAppointments
          ? `Cliente cadastrada e ${previewScheduleDates.length} horários agendados nos meses!`
          : 'Cliente Recorrente cadastrada com sucesso!'
      );
      setTimeout(() => setSuccessMsg(null), 3500);
      await loadRecurring();
      onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Use a session (+1)
  const handleUseSession = async (pkgId: string) => {
    try {
      await api.usePackageSession(pkgId);
      await loadRecurring();
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete recurring package
  const handleDeleteRecurring = async (pkgId: string) => {
    if (window.confirm('Deseja excluir este pacote de cliente recorrente?')) {
      try {
        await api.deleteRecurringPackage(pkgId);
        await loadRecurring();
        onRefreshData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // View sessions of a package
  const handleOpenPackageSessions = async (pkg: RecurringClientPackage) => {
    setViewingPackage(pkg);
    setLoadingPkgAppts(true);
    try {
      const all = await api.getAppointments({ search: pkg.clientName });
      setPackageAppointments(
        all.filter(
          (a) =>
            a.clientName.toLowerCase() === pkg.clientName.toLowerCase() && a.isRecurringPackage
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPkgAppts(false);
    }
  };

  // Create Professional
  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName.trim()) return;

    try {
      setSaving(true);
      await api.createProfessional({
        name: profName.trim(),
        role: profRole,
        phone: profPhone.trim(),
      });
      setShowAddProf(false);
      setProfName('');
      setProfPhone('');
      setSuccessMsg('Profissional adicionada com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
      onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeSection === 'all'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveSection('recurring')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'recurring'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Clientes Recorrentes & Pacotes ({recurringList.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'services'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Catálogo de Procedimentos ({services.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. SEÇÃO DE CLIENTES RECORRENTES & PACOTES              */}
      {/* ======================================================== */}
      {(activeSection === 'all' || activeSection === 'recurring') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-purple-200 dark:border-purple-900/50 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-300">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-2">
                  <span>Clientes Recorrentes & Pacotes</span>
                  <span className="text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                    Mensalistas
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cadastre pacotes mensais e agende automaticamente todos os sábados nos meses escolhidos
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddRecurring(!showAddRecurring)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddRecurring ? 'Fechar Formulário' : 'Novo Pacote / Cliente Recorrente'}</span>
            </button>
          </div>

          {/* Form to Add Recurring Client Package */}
          {showAddRecurring && (
            <form
              onSubmit={handleCreateRecurringClient}
              className="mt-5 p-4 sm:p-5 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/80 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Cadastrar Pacote & Lançar Horários nos Meses</span>
                </h3>
                <span className="text-[11px] text-purple-600 dark:text-purple-400">
                  Preenchimento Rápido
                </span>
              </div>

              {/* Preset Packages Quick Pick */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Modelos de Pacotes Sugeridos:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presetPackages.map((pkg, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectPresetPackage(pkg)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] font-semibold transition"
                    >
                      {pkg.name} ({pkg.months}m / {pkg.sessions} sessões)
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nome da Cliente *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Beatriz Lima"
                      value={recClientName}
                      onChange={(e) => setRecClientName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    WhatsApp da Cliente *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: (11) 98765-4321"
                      value={recClientPhone}
                      onChange={(e) => setRecClientPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Profissional Responsável
                  </label>
                  <select
                    value={recProfessional}
                    onChange={(e) => setRecProfessional(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    {professionals.map((p) => (
                      <option key={p._id} value={p.name}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Package Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nome / Descrição do Pacote *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pacote Hidratação Quinzenal + Escova"
                    value={recPackageName}
                    onChange={(e) => setRecPackageName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Quantos Meses de Duração? *
                  </label>
                  <select
                    value={recDurationMonths}
                    onChange={(e) => setRecDurationMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer font-bold"
                  >
                    <option value={1}>1 Mês</option>
                    <option value={2}>2 Meses</option>
                    <option value={3}>3 Meses (Trimestral)</option>
                    <option value={4}>4 Meses</option>
                    <option value={6}>6 Meses (Semestral)</option>
                    <option value={12}>12 Meses (Anual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Total de Sessões Inclusas
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={recTotalSessions}
                    onChange={(e) => setRecTotalSessions(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                  />
                </div>
              </div>

              {/* Price, Payment & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Valor Total do Pacote (R$) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="10"
                      required
                      value={recTotalPrice}
                      onChange={(e) => setRecTotalPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={recPaymentMethod}
                    onChange={(e) => setRecPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer font-medium"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Observações / Detalhes
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tinta 6.0, corte em camadas, etc."
                    value={recNotes}
                    onChange={(e) => setRecNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* AUTO-SCHEDULE TOGGLE */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoScheduleAppointments}
                    onChange={(e) => setAutoScheduleAppointments(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                      Lançar horários automaticamente na Agenda para todos os meses
                    </span>
                    <p className="text-[10px] text-purple-700/80 dark:text-purple-300/80">
                      Cria as sessões na agenda de cada mês (ex: todo sábado nos próximos {recDurationMonths} meses)
                    </p>
                  </div>
                </label>

                {autoScheduleAppointments && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-purple-100 dark:border-purple-800/60">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Data Inicial (1º atendimento)
                      </label>
                      <input
                        type="date"
                        value={recStartDate}
                        onChange={(e) => setRecStartDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Horário Fixo
                      </label>
                      <input
                        type="time"
                        value={recTime}
                        onChange={(e) => setRecTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Frequência
                      </label>
                      <select
                        value={recFrequency}
                        onChange={(e) => setRecFrequency(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="weekly">Toda Semana (Semanal)</option>
                        <option value="biweekly">Quinzenal (A cada 15 dias)</option>
                        <option value="monthly_date">1x por Mês (Mensal)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-200/50 dark:border-purple-800/40">
                <button
                  type="button"
                  onClick={() => setShowAddRecurring(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/30 transition active:scale-95 flex items-center gap-1.5"
                >
                  {saving ? (
                    'Salvando...'
                  ) : autoScheduleAppointments ? (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      <span>Cadastrar e Lançar {previewScheduleDates.length} Horários na Agenda</span>
                    </>
                  ) : (
                    <span>Cadastrar Pacote Recorrente</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* List of Recurring Clients */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {recurringList.map((rec) => {
              const progressPct = Math.round((rec.usedSessions / rec.totalSessions) * 100);
              const isFinished = rec.usedSessions >= rec.totalSessions;
              const remainingSessions = Math.max(0, rec.totalSessions - rec.usedSessions);

              return (
                <div
                  key={rec._id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-700 transition space-y-3"
                >
                  <div>
                    {/* Header: Client Name & Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          {rec.durationMonths} {rec.durationMonths === 1 ? 'Mês' : 'Meses'} &bull; R$ {rec.totalPrice.toFixed(2)}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                          {rec.clientName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isFinished
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isFinished ? 'Concluído' : 'Ativo'}
                        </span>
                        <button
                          onClick={() => handleDeleteRecurring(rec._id)}
                          title="Excluir pacote"
                          className="text-slate-400 hover:text-rose-500 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Package Name */}
                    <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 bg-purple-100/70 dark:bg-purple-950/60 px-2.5 py-1.5 rounded-lg border border-purple-200/60 dark:border-purple-800/40">
                      {rec.packageName}
                    </p>

                    {/* Phone & Professional */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-purple-500" />
                        {rec.professional}
                      </span>
                      {rec.clientPhone && (
                        <a
                          href={`https://wa.me/55${rec.clientPhone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(rec.clientName)},%20passando%20do%20Toque%20da%20Beleza%20para%20agendar%20sua%20próxima%20sessão%20do%20${encodeURIComponent(rec.packageName)}!`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {/* Session Progress Bar */}
                    <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Sessões: {rec.usedSessions}/{rec.totalSessions}
                        </span>
                        <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                          {remainingSessions > 0 ? `${remainingSessions} restantes` : 'Pacote concluído'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFinished ? 'bg-slate-400' : 'bg-purple-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleUseSession(rec._id)}
                      disabled={isFinished}
                      title="Registrar que a cliente fez 1 atendimento do pacote"
                      className="flex-1 py-1.5 px-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40 transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>+1 Sessão Feita</span>
                    </button>

                    <button
                      onClick={() => handleOpenPackageSessions(rec)}
                      className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Sessões</span>
                    </button>

                    {onScheduleClient && (
                      <button
                        onClick={() => onScheduleClient(rec.clientName, rec.clientPhone, rec.packageName, rec.professional)}
                        className="py-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agendar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CATÁLOGO DE PROCEDIMENTOS & CADASTRO COM DROPDOWN     */}
      {/* ======================================================== */}
      {(activeSection === 'all' || activeSection === 'services') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  Catálogo de Procedimentos & Serviços
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cadastre procedimentos com lista rápida (Progressiva, Corte Feminino, Botox, Hidratação)
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddService(!showAddService)}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddService ? 'Fechar Formulário' : 'Novo Procedimento'}</span>
            </button>
          </div>

          {/* Form to Add Service */}
          {showAddService && (
            <form
              onSubmit={handleCreateService}
              className="mt-5 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cadastrar Procedimento do Salão</span>
                </h3>
                <span className="text-[11px] text-slate-400">Escolha da lista ou digite um novo</span>
              </div>

              {/* Quick Preset Buttons (Progressiva, Corte Feminino, Botox, Hidratação, etc.) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Sugestões Rápidas:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SALON_SERVICES.map((preset) => (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleSelectPresetService(preset.name)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                        selectedPresetService === preset.name
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset.name} (R$ {preset.defaultPrice})
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nome do Procedimento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Progressiva Orgânica sem Formol"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Química & Alisamento">Química & Alisamento</option>
                    <option value="Corte">Corte & Finalização</option>
                    <option value="Tratamento & Hidratação">Tratamento & Hidratação</option>
                    <option value="Coloração & Mechas">Coloração & Mechas</option>
                    <option value="Penteados & Noivas">Penteados & Noivas</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Valor Padrão (R$) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="5"
                      required
                      value={servicePrice}
                      onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Duração Média (minutos)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(parseInt(e.target.value, 10) || 60)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Descrição / Cuidados
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lavagem com shampoo antirresíduo e escova com prancha de titânio."
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-sm transition active:scale-95 flex items-center gap-1.5"
                >
                  {saving ? 'Cadastrando...' : 'Cadastrar Procedimento'}
                </button>
              </div>
            </form>
          )}

          {/* List of Registered Services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
            {services.map((srv) => (
              <div
                key={srv._id}
                className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-800 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/40">
                      {srv.category}
                    </span>
                    <button
                      onClick={() => handleDeleteService(srv._id)}
                      title="Excluir serviço"
                      className="text-slate-400 hover:text-rose-500 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {srv.name}
                  </h4>
                  {srv.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {srv.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span>{srv.durationMinutes} min</span>
                  </div>
                  <div className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                    R$ {srv.defaultPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: SESSÕES DA CLIENTE RECORRENTE */}
      {viewingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {viewingPackage.clientName} &bull; {viewingPackage.packageName}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {viewingPackage.durationMonths} meses &bull; Total: {viewingPackage.totalSessions} sessões
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPackage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {loadingPkgAppts ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Buscando sessões agendadas...
                </div>
              ) : packageAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum agendamento individual vinculado diretamente a este pacote.
                </div>
              ) : (
                packageAppointments.map((appt, idx) => {
                  const parts = appt.date.split('-').map(Number);
                  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
                  const weekday = WEEKDAYS_PT[dt.getDay()];
                  const formatted = `${String(parts[2]).padStart(2, '0')}/${String(parts[1]).padStart(2, '0')}/${parts[0]}`;

                  return (
                    <div
                      key={appt._id || idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold font-mono text-[10px] rounded">
                            Sessão {appt.packageSessionNumber || idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {formatted} ({weekday})
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            às {appt.time}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {appt.procedure} &bull; {appt.professional}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          appt.status === 'Concluído'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.status === 'Em Atendimento'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setViewingPackage(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
