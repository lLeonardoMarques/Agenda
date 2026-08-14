import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  History,
  TrendingUp,
  Scissors,
  Plus,
  Sparkles,
  Code2,
  AlertTriangle,
  CheckCircle,
  Database,
  Sun,
  Moon,
  ChevronRight,
  User,
  Clock,
  Check,
  Smartphone,
} from 'lucide-react';
import { Appointment, Professional, RecurringClientPackage, ServiceItem } from './types';
import { api } from './lib/api';
import { TodayAgenda } from './components/TodayAgenda';
import { HistoryView } from './components/HistoryView';
import { FinancialReports } from './components/FinancialReports';
import { ServicesManagement } from './components/ServicesManagement';
import { AppointmentModal } from './components/AppointmentModal';
import { FinishAppointmentModal } from './components/FinishAppointmentModal';
import { ApiDocsModal } from './components/ApiDocsModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'agenda' | 'history' | 'reports' | 'services'>('agenda');

  // Theme (Dark / Light)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('toque_beleza_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('toque_beleza_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('toque_beleza_theme', 'light');
    }
  }, [isDark]);

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [recurringPackages, setRecurringPackages] = useState<RecurringClientPackage[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [selectedProfessional, setSelectedProfessional] = useState<string>('Todos');
  const [loading, setLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    cluster: string;
    databaseName: string;
  } | null>(null);

  // Modal states
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [finishingAppointment, setFinishingAppointment] = useState<Appointment | null>(null);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial loading
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, profRes, servRes, recurRes] = await Promise.all([
        api.getStatus().catch(() => null),
        api.getProfessionals().catch(() => []),
        api.getServices().catch(() => []),
        api.getRecurringPackages().catch(() => []),
      ]);

      if (statusRes?.database) {
        setDbStatus(statusRes.database);
      }
      if (profRes) setProfessionals(profRes);
      if (servRes) setServices(servRes);
      if (recurRes) setRecurringPackages(recurRes);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const appts = await api.getAppointments({
        date: selectedDate,
        professional: selectedProfessional !== 'Todos' ? selectedProfessional : undefined,
      });
      setAppointments(appts);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      showToast('Erro ao carregar agendamentos', 'error');
    }
  }, [selectedDate, selectedProfessional]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Appointment Actions
  const handleSaveAppointment = async (data: Partial<Appointment>) => {
    try {
      if (editingAppointment && editingAppointment._id) {
        await api.updateAppointment(editingAppointment._id, data);
        showToast('Agendamento atualizado com sucesso!');
      } else {
        await api.createAppointment(data);
        showToast('Novo horário agendado com sucesso!');
      }
      await loadAppointments();
      setIsApptModalOpen(false);
      setEditingAppointment(null);
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar agendamento', 'error');
      throw err;
    }
  };

  const handleSaveBatchAppointment = async (params: {
    appointments: Partial<Appointment>[];
    createPackage?: boolean;
    packageData?: any;
  }) => {
    try {
      const res = await api.createBatchAppointments(params);
      showToast(
        res.message || `${params.appointments.length} horários foram agendados para todos os meses!`
      );
      await loadInitialData();
      await loadAppointments();
      setIsApptModalOpen(false);
      setEditingAppointment(null);
    } catch (err: any) {
      showToast(err.message || 'Erro ao gerar agendamentos para os meses', 'error');
      throw err;
    }
  };

  const handleStartService = async (item: Appointment) => {
    try {
      await api.updateAppointment(item._id, { status: 'Em Atendimento' });
      showToast(`Atendimento de ${item.clientName} iniciado!`);
      await loadAppointments();
    } catch (err: any) {
      showToast('Erro ao iniciar atendimento', 'error');
    }
  };

  const handleOpenFinish = (item: Appointment) => {
    setFinishingAppointment(item);
    setIsFinishModalOpen(true);
  };

  const handleConfirmFinish = async (
    appointmentId: string,
    finalData: { price: number; paymentMethod: any; notes: string }
  ) => {
    try {
      await api.updateAppointment(appointmentId, {
        status: 'Concluído',
        price: finalData.price,
        paymentMethod: finalData.paymentMethod,
        notes: finalData.notes,
        completedAt: new Date().toISOString(),
      });
      showToast('Atendimento concluído e faturamento registrado!');
      await loadAppointments();
    } catch (err: any) {
      showToast('Erro ao concluir atendimento', 'error');
    }
  };

  const handleCancelService = async (item: Appointment) => {
    if (window.confirm(`Deseja cancelar o horário de ${item.clientName}?`)) {
      try {
        await api.updateAppointment(item._id, { status: 'Cancelado' });
        showToast('Agendamento cancelado.');
        await loadAppointments();
      } catch (err) {
        showToast('Erro ao cancelar agendamento', 'error');
      }
    }
  };

  const handleOpenNewAppointment = (prefilledDate?: string) => {
    setEditingAppointment(null);
    if (prefilledDate) setSelectedDate(prefilledDate);
    setIsApptModalOpen(true);
  };

  const handleScheduleRecurringClient = (
    clientName: string,
    clientPhone: string,
    procedure: string,
    professional?: string
  ) => {
    setEditingAppointment({
      _id: '',
      clientName,
      clientPhone,
      procedure,
      professional: professional || 'Flávia',
      price: 0,
      date: selectedDate || new Date().toISOString().split('T')[0],
      time: '10:00',
      durationMinutes: 60,
      status: 'Agendado',
      paymentMethod: 'Pix',
      isRecurringPackage: true,
      packageName: procedure,
    });
    setIsApptModalOpen(true);
  };

  const handleEditAppointment = (item: Appointment) => {
    setEditingAppointment(item);
    setIsApptModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans transition-colors duration-200 antialiased selection:bg-rose-500 selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col h-screen sticky top-0 shrink-0 select-none z-30">
        {/* Salon Branding */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-rose-500/20">
              TB
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight leading-none">
                Toque da Beleza
              </h1>
              <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-0.5 block">
                Gestão &bull; Flávia
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition ${
              activeTab === 'agenda'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda Diária</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition ${
              activeTab === 'history'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico & Filtros</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition ${
              activeTab === 'reports'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Relatórios Mensais</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition ${
              activeTab === 'services'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Serviços & Equipe</span>
          </button>
        </nav>

        {/* Sidebar Footer with Theme Switcher & Info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Theme switcher toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Tema do App
            </span>
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs transition"
            >
              {isDark ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Claro</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => setIsApiDocsOpen(true)}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Documentação & API</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-20 transition-colors">
          {/* Left Brand on Mobile / Page title on Desktop */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm shadow-rose-500/20">
                TB
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-none block">
                  Toque da Beleza
                </span>
                <span className="text-[10px] text-rose-500 font-semibold">
                  Flávia Hair Studio
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Painel de Atendimentos
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                Online
              </span>
            </div>
          </div>

          {/* Right Action Icons & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button (Works instantly on Mobile & Desktop) */}
            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Alternar tema claro e escuro"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 text-xs font-semibold active:scale-95"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline">Escuro</span>
                </>
              )}
            </button>

            {/* Desktop New Appointment Button */}
            <button
              onClick={() => handleOpenNewAppointment(selectedDate)}
              className="hidden sm:flex px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-500/20 active:scale-95 transition items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Horário</span>
            </button>

            {/* Professional avatar */}
            <div
              title="Perfil Flávia"
              className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-xs font-bold text-rose-700 dark:text-rose-300 cursor-pointer"
            >
              F
            </div>
          </div>
        </header>

        {/* Page Tab Content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {activeTab === 'agenda' && (
            <TodayAgenda
              appointments={appointments}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              professionals={professionals}
              selectedProfessional={selectedProfessional}
              setSelectedProfessional={setSelectedProfessional}
              onOpenNewAppointment={handleOpenNewAppointment}
              onEditAppointment={handleEditAppointment}
              onStartService={handleStartService}
              onFinishService={handleOpenFinish}
              onCancelService={handleCancelService}
              loading={loading}
              onOpenApiDocs={() => setIsApiDocsOpen(true)}
              onNavigateReports={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView professionals={professionals} services={services} />
          )}

          {activeTab === 'reports' && (
            <FinancialReports professionals={professionals} isDark={isDark} />
          )}

          {activeTab === 'services' && (
            <ServicesManagement
              services={services}
              professionals={professionals}
              recurringPackages={recurringPackages}
              onRefreshData={loadInitialData}
              onScheduleClient={handleScheduleRecurringClient}
            />
          )}
        </main>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 z-30 lg:hidden">
        <button
          onClick={() => handleOpenNewAppointment(selectedDate)}
          aria-label="Novo agendamento"
          className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/40 flex items-center justify-center active:scale-90 transition-transform focus:outline-none"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (Optimized for one-hand touch) */}
      <nav
        aria-label="Navegação móvel"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 lg:hidden"
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition active:scale-95 ${
              activeTab === 'agenda'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                activeTab === 'agenda'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : ''
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <span>Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition active:scale-95 ${
              activeTab === 'history'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                activeTab === 'history'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : ''
              }`}
            >
              <History className="w-5 h-5" />
            </div>
            <span>Histórico</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition active:scale-95 ${
              activeTab === 'reports'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                activeTab === 'reports'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : ''
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <span>Relatórios</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition active:scale-95 ${
              activeTab === 'services'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                activeTab === 'services'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : ''
              }`}
            >
              <Scissors className="w-5 h-5" />
            </div>
            <span>Serviços</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AppointmentModal
        isOpen={isApptModalOpen}
        onClose={() => {
          setIsApptModalOpen(false);
          setEditingAppointment(null);
        }}
        onSave={handleSaveAppointment}
        onSaveBatch={handleSaveBatchAppointment}
        initialData={editingAppointment}
        defaultDate={selectedDate}
        services={services}
        professionals={professionals}
        recurringPackages={recurringPackages}
      />

      <FinishAppointmentModal
        isOpen={isFinishModalOpen}
        onClose={() => {
          setIsFinishModalOpen(false);
          setFinishingAppointment(null);
        }}
        appointment={finishingAppointment}
        onConfirmFinish={handleConfirmFinish}
      />

      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-3 sm:right-6 left-3 sm:left-auto z-50 animate-bounce">
          <div
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 text-emerald-800 border-emerald-200 dark:bg-emerald-950/95 dark:text-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50/95 text-rose-800 border-rose-200 dark:bg-rose-950/95 dark:text-rose-200 dark:border-rose-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
