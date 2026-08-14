import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  DollarSign,
  CreditCard,
  FileText,
  Sparkles,
  Repeat,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  Info,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Appointment, Professional, RecurringClientPackage, ServiceItem } from '../types';
import {
  PRESET_SALON_SERVICES,
  generateRecurringScheduleDates,
  RecurringDateItem,
  WEEKDAYS_PT,
  MONTHS_PT,
} from '../lib/api';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Appointment>) => Promise<void>;
  onSaveBatch?: (params: {
    appointments: Partial<Appointment>[];
    createPackage?: boolean;
    packageData?: Partial<RecurringClientPackage>;
  }) => Promise<void>;
  initialData?: Appointment | null;
  defaultDate?: string;
  services: ServiceItem[];
  professionals: Professional[];
  recurringPackages?: RecurringClientPackage[];
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveBatch,
  initialData,
  defaultDate,
  services,
  professionals,
  recurringPackages = [],
}) => {
  // ==========================================
  // FORM STATE
  // ==========================================
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [procedure, setProcedure] = useState('');
  const [professional, setProfessional] = useState('Flávia');
  const [price, setPrice] = useState<number>(120);
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [paymentMethod, setPaymentMethod] = useState<'Pendente' | 'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Dinheiro'>('Pendente');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Agendado' | 'Em Atendimento' | 'Concluído' | 'Cancelado'>('Agendado');

  // ==========================================
  // RECURRING PACKAGE STATE
  // ==========================================
  const [isRecurringPackage, setIsRecurringPackage] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [packageDurationMonths, setPackageDurationMonths] = useState<number>(3);
  const [recurringFrequency, setRecurringFrequency] = useState<
    'weekly' | 'biweekly' | 'monthly_date' | 'custom_days'
  >('weekly');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([6]);
  const [pricingMode, setPricingMode] = useState<'split' | 'first_session' | 'per_session'>('split');
  const [totalPackagePrice, setTotalPackagePrice] = useState<number>(360);
  const [showSchedulePreview, setShowSchedulePreview] = useState(true);

  // ==========================================
  // UI STATE
  // ==========================================
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'recurring'>('single');

  // ==========================================
  // EFFECTS
  // ==========================================
  
  // Sync selected weekday with initial date
  useEffect(() => {
    if (date) {
      const parts = date.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(d.getTime())) {
        const dayOfWeek = d.getDay();
        if (!selectedWeekdays.includes(dayOfWeek)) {
          setSelectedWeekdays([dayOfWeek]);
        }
      }
    }
  }, [date]);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setClientName(initialData.clientName || '');
      setClientPhone(initialData.clientPhone || '');
      setProcedure(initialData.procedure || '');
      setProfessional(initialData.professional || 'Flávia');
      setPrice(initialData.price || 0);
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setTime(initialData.time || '09:00');
      setDurationMinutes(initialData.durationMinutes || 60);
      setPaymentMethod(initialData.paymentMethod || 'Pendente');
      setNotes(initialData.notes || '');
      setStatus(initialData.status || 'Agendado');

      setIsRecurringPackage(!!initialData.isRecurringPackage);
      setPackageName(initialData.packageName || '');
      setPackageDurationMonths(initialData.packageDurationMonths || 3);
    } else {
      resetForm();
    }
    setError(null);
    setSuccess(null);
  }, [initialData, isOpen]);

  // Reset form
  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    const defaultService = services[0];
    if (defaultService) {
      setProcedure(defaultService.name);
      setPrice(defaultService.defaultPrice);
      setDurationMinutes(defaultService.durationMinutes);
    } else {
      setProcedure('Corte Feminino & Finalização');
      setPrice(120);
      setDurationMinutes(60);
    }
    setProfessional(professionals[0]?.name || 'Flávia');
    const curDate = defaultDate || new Date().toISOString().split('T')[0];
    setDate(curDate);
    setTime('09:00');
    setPaymentMethod('Pendente');
    setNotes('');
    setStatus('Agendado');
    setIsRecurringPackage(false);
    setPackageName('');
    setPackageDurationMonths(3);
    setRecurringFrequency('weekly');
    setTotalPackagePrice(360);
    setActiveTab('single');
  };

  // Calculate generated dates
  const generatedScheduleDates = useMemo(() => {
    if (!isRecurringPackage || !date) return [];
    return generateRecurringScheduleDates({
      startDate: date,
      frequency: recurringFrequency,
      durationMonths: packageDurationMonths,
      customDays: recurringFrequency === 'custom_days' ? selectedWeekdays : undefined,
    });
  }, [isRecurringPackage, date, recurringFrequency, packageDurationMonths, selectedWeekdays]);

  // Update total sessions
  useEffect(() => {
    if (isRecurringPackage && generatedScheduleDates.length > 0) {
      if (!initialData) {
        const estimatedTotal = (Number(price) || 80) * generatedScheduleDates.length;
        setTotalPackagePrice(estimatedTotal);
      }
    }
  }, [isRecurringPackage, generatedScheduleDates.length, price, initialData]);

  // Group generated dates by Month
  const groupedScheduleByMonth = useMemo(() => {
    const groups: { [key: string]: RecurringDateItem[] } = {};
    generatedScheduleDates.forEach((item) => {
      const key = `${item.monthName} ${item.year}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [generatedScheduleDates]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleProcedureSelect = (selectedName: string) => {
    setProcedure(selectedName);
    const found = services.find((s) => s.name === selectedName);
    if (found) {
      setPrice(found.defaultPrice);
      setDurationMinutes(found.durationMinutes);
    } else {
      const preset = PRESET_SALON_SERVICES.find((p) => p.name === selectedName);
      if (preset) {
        setPrice(preset.defaultPrice);
        setDurationMinutes(preset.durationMinutes);
      }
    }
  };

  const handleSelectExistingPackage = (pkg: RecurringClientPackage) => {
    setClientName(pkg.clientName);
    setClientPhone(pkg.clientPhone);
    setProfessional(pkg.professional);
    setIsRecurringPackage(true);
    setPackageName(pkg.packageName);
    setPackageDurationMonths(pkg.durationMonths);
    setProcedure(`${pkg.packageName} (Sessão ${pkg.usedSessions + 1}/${pkg.totalSessions})`);
    setPrice(0);
    setActiveTab('recurring');
  };

  const toggleWeekday = (dayIndex: number) => {
    if (selectedWeekdays.includes(dayIndex)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter((d) => d !== dayIndex));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, dayIndex].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!clientName.trim()) {
      setError('Por favor, informe o nome da cliente.');
      return;
    }
    if (!clientPhone.trim()) {
      setError('Por favor, informe o telefone/WhatsApp da cliente.');
      return;
    }
    if (!procedure.trim()) {
      setError('Por favor, selecione ou digite o procedimento.');
      return;
    }

    if (isRecurringPackage && !packageName.trim()) {
      setError('Por favor, escreva o nome do pacote recorrente.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // If it's a recurring schedule with multiple dates
      if (isRecurringPackage && !initialData && generatedScheduleDates.length > 1 && onSaveBatch) {
        const total = generatedScheduleDates.length;

        const batchAppointments: Partial<Appointment>[] = generatedScheduleDates.map((item, idx) => {
          let sessionPrice = Number(price) || 0;
          if (pricingMode === 'split') {
            sessionPrice = Math.round(totalPackagePrice / total);
          } else if (pricingMode === 'first_session') {
            sessionPrice = idx === 0 ? totalPackagePrice : 0;
          }

          return {
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
            procedure: `${procedure} [${packageName}]`,
            professional,
            price: sessionPrice,
            date: item.date,
            time,
            durationMinutes: Number(durationMinutes) || 60,
            status: 'Agendado',
            paymentMethod: idx === 0 ? paymentMethod : pricingMode === 'first_session' ? 'Pix' : 'Pendente',
            notes: notes.trim()
              ? `${notes.trim()} (Sessão ${item.sessionNumber}/${total})`
              : `Sessão ${item.sessionNumber}/${total} do pacote ${packageName}`,
            source: 'Agendamento Recorrente',
            isRecurringPackage: true,
            packageName: packageName.trim(),
            packageDurationMonths: Number(packageDurationMonths),
            packageSessionsTotal: total,
            packageSessionNumber: item.sessionNumber,
          };
        });

        await onSaveBatch({
          appointments: batchAppointments,
          createPackage: true,
          packageData: {
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
            packageName: packageName.trim(),
            durationMonths: Number(packageDurationMonths),
            totalSessions: total,
            totalPrice: totalPackagePrice,
            paymentMethod,
            professional,
            startDate: generatedScheduleDates[0]?.date,
            endDate: generatedScheduleDates[generatedScheduleDates.length - 1]?.date,
            notes: notes.trim(),
          },
        });
        
        setSuccess(`✅ Pacote criado com ${total} sessões!`);
      } else {
        // Single appointment
        await onSave({
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          procedure: isRecurringPackage && !procedure.includes(packageName)
            ? `${procedure} [${packageName}]`
            : procedure,
          professional,
          price: Number(price) || 0,
          date,
          time,
          durationMinutes: Number(durationMinutes) || 60,
          paymentMethod,
          status,
          isRecurringPackage,
          packageName: isRecurringPackage ? packageName.trim() : undefined,
          packageDurationMonths: isRecurringPackage ? Number(packageDurationMonths) : undefined,
          packageSessionsTotal: isRecurringPackage ? generatedScheduleDates.length : undefined,
          packageSessionNumber: isRecurringPackage ? 1 : undefined,
          notes: notes.trim(),
        });
        
        setSuccess('✅ Agendamento salvo com sucesso!');
      }

      // Fechar modal após 1 segundo
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Erro ao salvar agendamento.');
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  
  const availableServices = [
    ...services.map((s) => ({ name: s.name, price: s.defaultPrice, isCustom: true })),
    ...PRESET_SALON_SERVICES.filter(
      (p) => !services.some((s) => s.name.toLowerCase() === p.name.toLowerCase())
    ).map((p) => ({ name: p.name, price: p.defaultPrice, isCustom: false })),
  ];

  const startDayName = useMemo(() => {
    if (!date) return '';
    const parts = date.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return WEEKDAYS_PT[d.getDay()] || '';
  }, [date]);

  const totalSessions = generatedScheduleDates.length;

  if (!isOpen) return null;

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* ========================================== */}
        {/* HEADER */}
        {/* ========================================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-2">
                <span>{initialData ? '✏️ Editar Agendamento' : '📅 Novo Agendamento'}</span>
                {isRecurringPackage && (
                  <span className="text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    <span>Pacote</span>
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Toque da Beleza • {professional || 'Flávia'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            {initialData && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' :
                status === 'Em Atendimento' ? 'bg-amber-100 text-amber-700' :
                status === 'Cancelado' ? 'bg-rose-100 text-rose-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {status}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* BODY */}
        {/* ========================================== */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Quick link to existing recurring packages */}
          {recurringPackages.length > 0 && !initialData && (
            <div className="p-2.5 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                <span>Vincular a Pacote Ativo:</span>
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {recurringPackages.slice(0, 4).map((pkg) => (
                  <button
                    type="button"
                    key={pkg._id}
                    onClick={() => handleSelectExistingPackage(pkg)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[11px] font-semibold border border-purple-200 dark:border-purple-800 rounded-lg transition"
                  >
                    {pkg.clientName} • {pkg.packageName.slice(0, 18)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TABS: Single vs Recurring */}
          {/* ========================================== */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTab('single'); setIsRecurringPackage(false); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'single' && !isRecurringPackage
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              📌 Agendamento Único
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('recurring'); setIsRecurringPackage(true); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                isRecurringPackage
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🔄 Pacote Recorrente
            </button>
          </div>

          {/* ========================================== */}
          {/* CLIENT DETAILS */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Cliente *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp / Telefone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: (11) 98765-4321"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* SERVICE SELECTION */}
          {/* ========================================== */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Procedimento *
              </label>
              <span className="text-[10px] text-slate-400">Clique para selecionar</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2 max-h-20 overflow-y-auto pb-1">
              {availableServices.slice(0, 8).map((srv, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleProcedureSelect(srv.name)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition ${
                    procedure === srv.name
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {srv.name.length > 20 ? srv.name.slice(0, 20) + '…' : srv.name}
                </button>
              ))}
            </div>

            <div className="relative">
              <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ou digite o procedimento..."
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition"
              />
            </div>
          </div>

          {/* ========================================== */}
          {/* DATE, TIME & DURATION */}
          {/* ========================================== */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">{startDayName}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Horário *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duração (min)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          {/* ========================================== */}
          {/* PROFESSIONAL & PRICE */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Profissional
              </label>
              <select
                value={professional}
                onChange={(e) => setProfessional(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
              >
                {professionals.map((p) => (
                  <option key={p._id} value={p.name}>
                    {p.name} • {p.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRecurringPackage ? 'Valor Unitário (R$)' : 'Valor (R$)'}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="5"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* RECURRING PACKAGE SECTION */}
          {/* ========================================== */}
          {isRecurringPackage && (
            <div className="p-3.5 bg-purple-50/80 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-800/80 rounded-2xl space-y-3.5 animate-in fade-in duration-300">
              
              {/* Package Name & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Nome do Pacote *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pacote Hidratação + Escova"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Duração
                  </label>
                  <select
                    value={packageDurationMonths}
                    onChange={(e) => setPackageDurationMonths(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer font-bold"
                  >
                    {[1, 2, 3, 4, 6, 12].map((m) => (
                      <option key={m} value={m}>{m} {m === 1 ? 'Mês' : 'Meses'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Frequência:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'weekly', label: 'Toda Semana', desc: `Todo ${startDayName || 'Sábado'}` },
                    { value: 'biweekly', label: 'Quinzenal', desc: 'A cada 15 dias' },
                    { value: 'monthly_date', label: '1x por Mês', desc: 'Mesmo dia' },
                    { value: 'custom_days', label: 'Dias Fixos', desc: 'Escolher dias' },
                  ].map(({ value, label, desc }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setRecurringFrequency(value as any)}
                      className={`p-2 rounded-xl text-left border text-xs font-semibold transition ${
                        recurringFrequency === value
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{label}</span>
                        {recurringFrequency === value && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span className="text-[10px] opacity-80 block">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Weekdays */}
              {recurringFrequency === 'custom_days' && (
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Dias da semana:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS_PT.map((dayName, idx) => {
                      const isSelected = selectedWeekdays.includes(idx);
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => toggleWeekday(idx)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100'
                          }`}
                        >
                          {dayName.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-purple-200/50 dark:border-purple-800/40">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Valor Total (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={totalPackagePrice}
                      onChange={(e) => setTotalPackagePrice(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Cobrança
                  </label>
                  <select
                    value={pricingMode}
                    onChange={(e) => setPricingMode(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer font-semibold"
                  >
                    <option value="split">
                      Dividir ({Math.round(totalPackagePrice / (totalSessions || 1))}/sessão)
                    </option>
                    <option value="first_session">Cobrar total na 1ª</option>
                    <option value="per_session">Valor fixo por sessão</option>
                  </select>
                </div>
              </div>

              {/* Schedule Preview */}
              <div className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-purple-200 dark:border-purple-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200 font-bold text-xs">
                    <CalendarDays className="w-4 h-4 text-purple-600" />
                    <span>
                      {totalSessions} sessões em {packageDurationMonths} {packageDurationMonths === 1 ? 'mês' : 'meses'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSchedulePreview(!showSchedulePreview)}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    {showSchedulePreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showSchedulePreview ? 'Ocultar' : 'Ver'}
                  </button>
                </div>

                {showSchedulePreview && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mt-2">
                    {Object.entries(groupedScheduleByMonth).map(([monthLabel, items]: [string, RecurringDateItem[]]) => (
                      <div
                        key={monthLabel}
                        className="bg-purple-50/50 dark:bg-purple-950/30 rounded-lg p-2 border border-purple-100 dark:border-purple-900/40"
                      >
                        <div className="text-[11px] font-bold text-purple-950 dark:text-purple-200 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>{monthLabel}</span>
                          </span>
                          <span className="text-[10px] font-normal text-purple-700 dark:text-purple-300">
                            {items.length} {items.length === 1 ? 'atendimento' : 'atendimentos'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {items.map((it: RecurringDateItem) => (
                            <span
                              key={it.date}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-md text-[10px] font-mono font-medium text-slate-800 dark:text-slate-200"
                            >
                              <span className="text-purple-600 font-bold">#{it.sessionNumber}</span>
                              <span>{it.formattedDate.slice(0, 5)}</span>
                              <span className="text-slate-400">({it.weekdayName.slice(0, 3)})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* PAYMENT & NOTES */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
              >
                <option value="Pendente">⏳ Pendente</option>
                <option value="Pix">📱 Pix</option>
                <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                <option value="Cartão de Débito">💳 Cartão de Débito</option>
                <option value="Dinheiro">💰 Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações
              </label>
              <input
                type="text"
                placeholder="Ex: Tinta 6.0, corte em camadas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition"
              />
            </div>
          </div>

          {/* ========================================== */}
          {/* ACTIONS */}
          {/* ========================================== */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition active:scale-95"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition disabled:opacity-50 active:scale-95 flex items-center gap-1.5 ${
                isRecurringPackage
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                  : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : isRecurringPackage && !initialData ? (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  <span>Criar {totalSessions} Sessões</span>
                </>
              ) : (
                <span>{initialData ? 'Atualizar' : 'Confirmar'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};