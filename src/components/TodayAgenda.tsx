import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Scissors,
  DollarSign,
  CheckCircle2,
  PlayCircle,
  XCircle,
  MessageCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Sparkles,
  AlertCircle,
  CreditCard,
  Check,
  TrendingUp,
  LayoutGrid,
  List,
  ArrowUpRight,
  FileText,
  Smartphone,
  Repeat,
  CalendarDays,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Appointment, Professional } from '../types';
import { MONTHS_PT, WEEKDAYS_PT, api } from '../lib/api';

interface TodayAgendaProps {
  appointments: Appointment[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  professionals: Professional[];
  selectedProfessional: string;
  setSelectedProfessional: (prof: string) => void;
  onOpenNewAppointment: (prefilledDate?: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onStartService: (appointment: Appointment) => void;
  onFinishService: (appointment: Appointment) => void;
  onCancelService: (appointment: Appointment) => void;
  loading: boolean;
  onOpenApiDocs?: () => void;
  onNavigateReports?: () => void;
}

export const TodayAgenda: React.FC<TodayAgendaProps> = ({
  appointments,
  selectedDate,
  setSelectedDate,
  professionals,
  selectedProfessional,
  setSelectedProfessional,
  onOpenNewAppointment,
  onEditAppointment,
  onStartService,
  onFinishService,
  onCancelService,
  loading,
  onOpenApiDocs,
  onNavigateReports,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Discreet month navigator toggle (default collapsed for clean mobile experience)
  const [showMonthNav, setShowMonthNav] = useState<boolean>(() => {
    try {
      return localStorage.getItem('toque_show_month_nav') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMonthNav = () => {
    setShowMonthNav((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('toque_show_month_nav', String(next));
      } catch {}
      return next;
    });
  };

  // Modal to view recurring group sessions
  const [viewingRecurringGroupId, setViewingRecurringGroupId] = useState<string | null>(null);
  const [recurringGroupItems, setRecurringGroupItems] = useState<Appointment[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);

  // Month navigation state
  const selectedDateParts = useMemo(() => {
    const parts = selectedDate.split('-').map(Number);
    return {
      year: parts[0] || new Date().getFullYear(),
      monthIndex: (parts[1] ? parts[1] - 1 : new Date().getMonth()),
      day: parts[2] || new Date().getDate(),
    };
  }, [selectedDate]);

  const [navYear, setNavYear] = useState(selectedDateParts.year);
  const [navMonth, setNavMonth] = useState(selectedDateParts.monthIndex);

  // Sync nav month when selectedDate changes
  useEffect(() => {
    setNavYear(selectedDateParts.year);
    setNavMonth(selectedDateParts.monthIndex);
  }, [selectedDateParts.year, selectedDateParts.monthIndex]);

  // Navigate months
  const handlePrevMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear((y) => y - 1);
    } else {
      setNavMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear((y) => y + 1);
    } else {
      setNavMonth((m) => m + 1);
    }
  };

  const handleJumpToMonth = (monthIdx: number, year: number) => {
    setNavMonth(monthIdx);
    setNavYear(year);
    // Find first saturday or 1st day of that month
    const padM = String(monthIdx + 1).padStart(2, '0');
    const firstSat = new Date(year, monthIdx, 1);
    let targetDay = 1;
    for (let d = 1; d <= 7; d++) {
      if (new Date(year, monthIdx, d).getDay() === 6) {
        targetDay = d;
        break;
      }
    }
    const padD = String(targetDay).padStart(2, '0');
    setSelectedDate(`${year}-${padM}-${padD}`);
  };

  // Change day helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleSetToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  // Generate shortcut list of 6 months ahead
  const upcomingMonths = useMemo(() => {
    const list: { monthIdx: number; year: number; label: string; isCurrent: boolean }[] = [];
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    for (let i = 0; i < 6; i++) {
      let m = (curMonth + i) % 12;
      let y = curYear + Math.floor((curMonth + i) / 12);
      list.push({
        monthIdx: m,
        year: y,
        label: `${MONTHS_PT[m].slice(0, 3)}/${String(y).slice(-2)}`,
        isCurrent: m === navMonth && y === navYear,
      });
    }
    return list;
  }, [navMonth, navYear]);

  // Days in current navigated month
  const monthDays = useMemo(() => {
    const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
    const list: { dayNum: number; dateStr: string; dayOfWeek: number; isSaturday: boolean }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const padM = String(navMonth + 1).padStart(2, '0');
      const padD = String(d).padStart(2, '0');
      const dateStr = `${navYear}-${padM}-${padD}`;
      const dt = new Date(navYear, navMonth, d);
      const dow = dt.getDay();
      list.push({
        dayNum: d,
        dateStr,
        dayOfWeek: dow,
        isSaturday: dow === 6,
      });
    }
    return { list };
  }, [navYear, navMonth]);

  // Filter appointments
  const filtered = appointments.filter((item) => {
    const matchSearch =
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientPhone.includes(searchTerm) ||
      item.procedure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.packageName && item.packageName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchProf =
      selectedProfessional === 'Todos' || item.professional === selectedProfessional;

    let matchStatus = true;
    if (statusFilter === 'Recorrentes') {
      matchStatus = !!item.isRecurringPackage;
    } else if (statusFilter !== 'Todos') {
      matchStatus = item.status === statusFilter;
    }

    return matchSearch && matchProf && matchStatus;
  });

  // Calculate day summary metrics
  const totalCount = appointments.length;
  const inServiceCount = appointments.filter((a) => a.status === 'Em Atendimento').length;
  const completedCount = appointments.filter((a) => a.status === 'Concluído').length;
  const scheduledCount = appointments.filter((a) => a.status === 'Agendado').length;
  const recurringCount = appointments.filter((a) => a.isRecurringPackage).length;
  const totalRevenueDay = appointments
    .filter((a) => a.status === 'Concluído')
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const potentialRevenueDay = appointments
    .filter((a) => a.status !== 'Cancelado')
    .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

  // WhatsApp quick messaging
  const sendWhatsAppMessage = (item: Appointment) => {
    const cleanPhone = item.clientPhone.replace(/\D/g, '');
    const formattedDate = new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const isFree = item.isRecurringPackage && Number(item.price) === 0;
    const valueText = isFree
      ? 'Incluso no Pacote Recorrente'
      : `R$ ${Number(item.price).toFixed(2)}`;

    const msg = encodeURIComponent(
      `Olá, *${item.clientName}*! Tudo bem? ✨\n\nPassando para confirmar seu horário de *${item.procedure}* com a profissional *${item.professional}* no salão *Toque da Beleza*:\n📅 Data: *${formattedDate}*\n⏰ Horário: *${item.time}*\n💰 Valor: *${valueText}*\n\nQualquer dúvida, estamos à disposição!`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  // Helper to color procedure pills
  const getProcedureBadgeClass = (proc: string) => {
    const lower = proc.toLowerCase();
    if (lower.includes('progressiva')) {
      return 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-900/40';
    }
    if (lower.includes('botox')) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40';
    }
    if (lower.includes('mecha') || lower.includes('luz')) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40';
    }
    if (lower.includes('corte') || lower.includes('escova')) {
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40';
    }
    if (lower.includes('color') || lower.includes('tinta') || lower.includes('raiz')) {
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-100 dark:border-rose-900/40';
    }
    if (lower.includes('hidrata') || lower.includes('nutri') || lower.includes('terapia')) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
  };

  // Open recurring series viewer
  const handleOpenRecurringGroup = async (groupId: string, appt: Appointment) => {
    setViewingRecurringGroupId(groupId || appt._id);
    setLoadingGroup(true);
    try {
      if (groupId) {
        const list = await api.getRecurringGroup(groupId);
        setRecurringGroupItems(list);
      } else {
        // Fallback: search by client name
        const all = await api.getAppointments({ search: appt.clientName });
        setRecurringGroupItems(all.filter((a) => a.isRecurringPackage));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGroup(false);
    }
  };

  // Format date display
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const dateDisplay = dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ========================================================================= */}
      {/* NAVEGADOR DE MESES & RECORRÊNCIA DISCRETO COM BOTÃO EXIBIR/OCULTAR        */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 p-2.5 sm:p-3.5 shadow-xs transition-all">
        {/* Compact Toggle Header (Always visible & mobile-first) */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={toggleMonthNav}
            className="flex items-center gap-2 text-left group flex-1 min-w-0 py-1"
            title={showMonthNav ? 'Ocultar Navegador de Meses' : 'Exibir Navegador de Meses'}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0 group-hover:scale-105 transition">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate capitalize">
                  {MONTHS_PT[navMonth]} {navYear}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Meses & Recorrentes
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {showMonthNav ? 'Toque para recolher a régua de meses' : 'Toque para abrir sábados e meses futuros'}
              </p>
            </div>
          </button>

          {/* Quick Month Next/Prev and Expand Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handlePrevMonth}
              title="Mês Anterior"
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 transition active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Próximo Mês"
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 transition active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={toggleMonthNav}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1 border ${
                showMonthNav
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50'
              }`}
            >
              <span className="hidden sm:inline">{showMonthNav ? 'Ocultar' : 'Exibir Meses'}</span>
              <span className="sm:hidden">{showMonthNav ? 'Fechar' : 'Meses'}</span>
              {showMonthNav ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* EXPANDED CONTENT (Only shown when user clicks to show) */}
        {showMonthNav && (
          <div className="mt-2.5 pt-2.5 border-t border-purple-100 dark:border-purple-900/40 space-y-2.5 animate-fade-in">
            {/* Horizontal Shortcut Pills for Upcoming Months */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Atalhos:
              </span>
              {upcomingMonths.map((mItem) => (
                <button
                  key={`${mItem.year}-${mItem.monthIdx}`}
                  onClick={() => handleJumpToMonth(mItem.monthIdx, mItem.year)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition active:scale-95 border ${
                    mItem.isCurrent
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                  }`}
                >
                  {mItem.label}
                </button>
              ))}
            </div>

            {/* Horizontal Day Strip */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1.5 px-0.5">
                <span className="font-semibold">Dias de {MONTHS_PT[navMonth]} {navYear}:</span>
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" /> Sábados destacados
                </span>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900">
                {monthDays.list.map((item) => {
                  const isSelected = item.dateStr === selectedDate;
                  const isItemToday = item.dateStr === new Date().toISOString().split('T')[0];
                  const weekdayShort = WEEKDAYS_PT[item.dayOfWeek].slice(0, 3);

                  return (
                    <button
                      key={item.dateStr}
                      onClick={() => setSelectedDate(item.dateStr)}
                      className={`px-2.5 py-1.5 rounded-xl text-center shrink-0 min-w-[48px] transition-all active:scale-95 border ${
                        isSelected
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs font-bold scale-105 ring-2 ring-rose-300 dark:ring-rose-800'
                          : item.isSaturday
                          ? 'bg-purple-100/90 dark:bg-purple-950/60 hover:bg-purple-200 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800 font-semibold'
                          : isItemToday
                          ? 'bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-[9px] font-bold block uppercase tracking-wider opacity-80">
                        {weekdayShort}
                      </span>
                      <span className="text-sm font-extrabold font-mono block">
                        {item.dayNum}
                      </span>
                      {item.isSaturday && (
                        <span className="text-[8px] font-bold uppercase text-purple-600 dark:text-purple-300 block -mt-0.5">
                          Sáb
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Filter and Date Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Title & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight capitalize">
                  {dateDisplay}
                  {isToday && (
                    <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 inline-block align-middle">
                      Hoje
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filtered.length} agendamento{filtered.length !== 1 ? 's' : ''} para este dia
                  {recurringCount > 0 && (
                    <span className="text-purple-600 dark:text-purple-400 font-semibold ml-1">
                      ({recurringCount} recorrente{recurringCount !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Add Button on mobile */}
            <button
              onClick={() => onOpenNewAppointment(selectedDate)}
              className="sm:hidden px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo</span>
            </button>
          </div>

          {/* Date Selector and Professional Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Day Nav Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={handlePrevDay}
                aria-label="Dia anterior"
                className="p-2 sm:p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleSetToday}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isToday
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                Hoje
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent border-0 outline-none cursor-pointer font-mono"
              />

              <button
                onClick={handleNextDay}
                aria-label="Próximo dia"
                className="p-2 sm:p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filter by Professional */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto">
              <User className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer w-full sm:w-auto"
              >
                <option value="Todos">Todas as Profissionais</option>
                {professionals.map((p) => (
                  <option key={p._id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Add Button */}
            <button
              onClick={() => onOpenNewAppointment(selectedDate)}
              className="hidden sm:inline-flex px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 items-center gap-1.5 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Horário</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Faturado Hoje</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              R$ {totalRevenueDay.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {completedCount} atendimento{completedCount !== 1 ? 's' : ''} concluído{completedCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Em Andamento</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {inServiceCount}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Na cadeira agora
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Recorrentes / Pacotes</span>
              <span className="w-2 h-2 rounded-full bg-purple-500" />
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-purple-700 dark:text-purple-300 font-mono mt-0.5">
              {recurringCount}
            </div>
            <span className="text-[10px] text-purple-600/80 dark:text-purple-400 block mt-0.5">
              Mensalistas no dia
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Previsto Total</span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              R$ {potentialRevenueDay.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {totalCount} cliente{totalCount !== 1 ? 's' : ''} agendada{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Main Agenda Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters and View Switcher Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          {/* Status Pills Scrollable on Mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['Todos', 'Agendado', 'Em Atendimento', 'Concluído', 'Recorrentes', 'Cancelado'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    statusFilter === status
                      ? status === 'Recorrentes'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-rose-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {status === 'Recorrentes' ? '🔁 Recorrentes' : status}
                </button>
              )
            )}
          </div>

          {/* Search & View Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente ou pacote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Desktop View Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={() => setViewMode('cards')}
                title="Visualização em Cards"
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Visualização em Tabela"
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Appointment List / Cards Area */}
        <div className="p-3 sm:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs">Carregando agendamentos do banco de dados...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhum agendamento para este dia ({selectedDate})
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Não há horários marcados com os filtros atuais. Você pode agendar uma cliente individual ou criar um pacote recorrente para todos os meses!
              </p>
              <button
                onClick={() => onOpenNewAppointment(selectedDate)}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Agendar Horário Neste Dia</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Responsive Cards Layout */}
              {viewMode === 'cards' || window.innerWidth < 640 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filtered.map((item) => {
                    const isCompleted = item.status === 'Concluído';
                    const isInService = item.status === 'Em Atendimento';
                    const isCancelled = item.status === 'Cancelado';
                    const isRecurring = !!item.isRecurringPackage;

                    return (
                      <div
                        key={item._id}
                        className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                          isInService
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 shadow-xs'
                            : isCompleted
                            ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/40'
                            : isCancelled
                            ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                            : isRecurring
                            ? 'bg-purple-50/20 dark:bg-purple-950/10 border-purple-200 dark:border-purple-900/50 hover:border-purple-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900'
                        }`}
                      >
                        {/* Status ribbon border */}
                        {isInService && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse" />
                        )}
                        {isCompleted && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                        )}
                        {isRecurring && !isCompleted && !isInService && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
                        )}

                        {/* Top row: Time + Status Badge + Price */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-rose-500" />
                              {item.time}
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({item.durationMinutes}m)
                              </span>
                            </span>

                            {isInService && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold animate-pulse">
                                Em Atendimento
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                                Concluído
                              </span>
                            )}
                            {isCancelled && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold">
                                Cancelado
                              </span>
                            )}
                          </div>

                          <div className="text-right font-mono">
                            {isRecurring && Number(item.price) === 0 ? (
                              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                Incluso no Pacote
                              </span>
                            ) : (
                              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                R$ {Number(item.price).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* RECURRING PACKAGE BADGE */}
                        {isRecurring && (
                          <div className="mb-2.5 p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/70 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200 text-xs font-bold">
                              <Repeat className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span className="truncate">
                                {item.packageName || 'Pacote Recorrente'}
                              </span>
                              {item.packageSessionNumber && (
                                <span className="text-[10px] bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.2 rounded font-mono font-bold">
                                  Sessão {item.packageSessionNumber}/{item.packageSessionsTotal || 4}
                                </span>
                              )}
                            </div>

                            {item.recurringGroupId && (
                              <button
                                type="button"
                                onClick={() => handleOpenRecurringGroup(item.recurringGroupId!, item)}
                                className="text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:underline shrink-0 flex items-center gap-0.5"
                              >
                                <span>Ver todas</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Middle row: Client + WhatsApp + Professional */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{item.clientName}</span>
                            </div>

                            <button
                              onClick={() => sendWhatsAppMessage(item)}
                              title="Conversar no WhatsApp"
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60 transition active:scale-95"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                              <span className="text-[11px] font-mono">{item.clientPhone}</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium ${getProcedureBadgeClass(
                                item.procedure
                              )}`}
                            >
                              {item.procedure}
                            </span>

                            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3 text-rose-500" />
                              {item.professional}
                            </span>

                            {item.paymentMethod && item.paymentMethod !== 'Pendente' && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {item.paymentMethod}
                              </span>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 mt-2">
                              💬 {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Bottom row: Touch Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {item.status === 'Agendado' && (
                            <button
                              onClick={() => onStartService(item)}
                              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Iniciar Atendimento</span>
                            </button>
                          )}

                          {item.status === 'Em Atendimento' && (
                            <button
                              onClick={() => onFinishService(item)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Concluir & Pagamento</span>
                            </button>
                          )}

                          {item.status === 'Concluído' && (
                            <div className="flex-1 py-1.5 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                              <Check className="w-4 h-4" />
                              <span>Atendimento Concluído</span>
                            </div>
                          )}

                          <button
                            onClick={() => onEditAppointment(item)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition active:scale-95"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Desktop Table View */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <th className="py-3 px-4 font-semibold">Horário</th>
                        <th className="py-3 px-4 font-semibold">Cliente</th>
                        <th className="py-3 px-4 font-semibold">Procedimento / Pacote</th>
                        <th className="py-3 px-4 text-right font-semibold">Valor</th>
                        <th className="py-3 px-4 text-center font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filtered.map((item) => (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {item.time}
                            <span className="text-[10px] text-slate-400 font-normal block">
                              {item.durationMinutes}m &bull; {item.professional}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {item.clientName}
                            <span className="text-[10px] text-slate-400 block font-normal font-mono">
                              {item.clientPhone}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium ${getProcedureBadgeClass(
                                item.procedure
                              )}`}
                            >
                              {item.procedure}
                            </span>
                            {item.isRecurringPackage && (
                              <span className="text-[10px] text-purple-600 font-bold block mt-0.5">
                                🔁 {item.packageName} (Sessão {item.packageSessionNumber}/{item.packageSessionsTotal})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {item.isRecurringPackage && Number(item.price) === 0 ? (
                              <span className="text-[10px] text-purple-600 font-bold">Incluso no Pacote</span>
                            ) : (
                              `R$ ${Number(item.price).toFixed(2)}`
                            )}
                            <span className="text-[10px] text-slate-400 block font-sans font-normal">
                              {item.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {item.status === 'Agendado' && (
                                <button
                                  onClick={() => onStartService(item)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                                >
                                  Iniciar
                                </button>
                              )}
                              {item.status === 'Em Atendimento' && (
                                <button
                                  onClick={() => onFinishService(item)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                                >
                                  Concluir
                                </button>
                              )}
                              {item.status === 'Concluído' && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Concluído
                                </span>
                              )}
                              <button
                                onClick={() => onEditAppointment(item)}
                                className="px-2 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-medium"
                              >
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: VISUALIZADOR DE SESSÕES DO PACOTE RECORRENTE */}
      {viewingRecurringGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sessões do Pacote Recorrente
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Cronograma completo gerado para todos os meses
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingRecurringGroupId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {loadingGroup ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Carregando sessões...
                </div>
              ) : recurringGroupItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhuma sessão adicional encontrada.
                </div>
              ) : (
                recurringGroupItems.map((item, idx) => {
                  const parts = item.date.split('-').map(Number);
                  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
                  const weekday = WEEKDAYS_PT[dt.getDay()];
                  const formatted = `${String(parts[2]).padStart(2, '0')}/${String(parts[1]).padStart(2, '0')}/${parts[0]}`;

                  return (
                    <div
                      key={item._id || idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold font-mono text-[10px] rounded">
                            Sessão {item.packageSessionNumber || idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {formatted} ({weekday})
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            às {item.time}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {item.procedure} &bull; {item.professional}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'Concluído'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Em Atendimento'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedDate(item.date);
                            setViewingRecurringGroupId(null);
                          }}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 transition"
                        >
                          Ir p/ dia
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setViewingRecurringGroupId(null)}
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
