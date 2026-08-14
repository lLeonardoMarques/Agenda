import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart, Bar, Doughnut, Pie, getElementAtEvent } from 'react-chartjs-2';
import {
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Calendar,
  User,
  Scissors,
  CreditCard,
  Printer,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Layers,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';
import { FinancialReport, Professional } from '../types';
import { api } from '../lib/api';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialReportsProps {
  professionals: Professional[];
  isDark: boolean;
}

type TimeGranularity = 'year' | 'month' | 'day';

export const FinancialReports: React.FC<FinancialReportsProps> = ({ professionals, isDark }) => {
  // Segmentation and Filter states
  const [granularity, setGranularity] = useState<TimeGranularity>('month');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('Todos');

  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mainChartRef = useRef<any>(null);

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const availableYears = [2024, 2025, 2026, 2027];

  const fetchReport = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const data = await api.getFinancialReport({
      granularity,
      year: selectedYear,
      month: selectedMonth,
      day: selectedDay,
      professional: selectedProfessional !== 'Todos' ? selectedProfessional : undefined,
    });

    console.log('📊 Dados recebidos:', data);

    // ✅ Extrair os dados corretamente - USANDO TYPE GUARD
    let reportData: any = data;
    
    // Verificar se a resposta tem a estrutura { success: true, data: {...} }
    if (data && typeof data === 'object' && 'success' in data && data.success === true && 'data' in data) {
      reportData = data.data;
    } else if (data && typeof data === 'object' && 'data' in data) {
      reportData = data.data;
    }

    if (!reportData || !reportData.metrics) {
      console.warn('⚠️ Nenhum dado financeiro encontrado');
      setReport(null);
      setLoading(false);
      return;
    }

    // Garantir que os dados são arrays
    const safeData: FinancialReport = {
      ...reportData,
      timelineData: Array.isArray(reportData?.timelineData) ? reportData.timelineData : [],
      dailyRevenue: Array.isArray(reportData?.dailyRevenue) ? reportData.dailyRevenue : [],
      monthlyRevenue: Array.isArray(reportData?.monthlyRevenue) ? reportData.monthlyRevenue : [],
      yearlyRevenue: Array.isArray(reportData?.yearlyRevenue) ? reportData.yearlyRevenue : [],
      procedureStats: Array.isArray(reportData?.procedureStats) ? reportData.procedureStats : [],
      professionalStats: Array.isArray(reportData?.professionalStats) ? reportData.professionalStats : [],
      paymentMethodStats: Array.isArray(reportData?.paymentMethodStats) ? reportData.paymentMethodStats : [],
      metrics: reportData?.metrics || {
        totalRevenue: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        averageTicket: 0,
        completionRate: 0,
        growthRate: 0,
      },
    };

    console.log('✅ Dados processados:', safeData);
    setReport(safeData);
  } catch (err) {
    console.error('❌ Erro ao buscar relatório financeiro:', err);
    setError('Erro ao carregar dados financeiros. Tente novamente.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchReport();
  }, [granularity, selectedYear, selectedMonth, selectedDay, selectedProfessional]);

  // Theme colors for Chart.js
  const textColor = isDark ? '#cbd5e1' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)';

  // Safe data arrays
  const safeTimelineData = Array.isArray(report?.timelineData) ? report.timelineData : [];
  const safeProcedureStats = Array.isArray(report?.procedureStats) ? report.procedureStats : [];
  const safeProfessionalStats = Array.isArray(report?.professionalStats) ? report.professionalStats : [];
  const safePaymentMethodStats = Array.isArray(report?.paymentMethodStats) ? report.paymentMethodStats : [];

  // =========================================================================
  // 1. PRIMARY EVOLUTION CHART (HERO CHART WITH SEGMENTATION)
  // =========================================================================
  const evolutionLabels = safeTimelineData.map((d) => d.label);
  const evolutionRevenues = safeTimelineData.map((d) => d.revenue);
  const evolutionCounts = safeTimelineData.map((d) => d.count);

  const mainEvolutionChartData = {
    labels: evolutionLabels.length > 0 ? evolutionLabels : ['Sem dados'],
    datasets: [
      {
        type: 'line' as const,
        label: 'Faturamento (R$)',
        data: evolutionRevenues.length > 0 ? evolutionRevenues : [0],
        borderColor: '#f43f5e',
        backgroundColor: isDark ? 'rgba(244, 63, 94, 0.18)' : 'rgba(244, 63, 94, 0.10)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: '#e11d48',
        pointBorderColor: isDark ? '#0f172a' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: 'Atendimentos',
        data: evolutionCounts.length > 0 ? evolutionCounts : [0],
        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(139, 92, 246, 0.25)',
        borderColor: '#8b5cf6',
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.5,
        yAxisID: 'y1',
      },
    ],
  };

  const mainEvolutionChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: textColor,
          boxWidth: 12,
          font: { size: 11, weight: 'bold' },
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex;
            const item = safeTimelineData[idx];
            return item?.secondaryLabel || items[0]?.label || '';
          },
          label: (context: any) => {
            if (context.datasetIndex === 0) {
              return ` Faturamento: R$ ${context.parsed.y.toFixed(2)}`;
            }
            return ` Atendimentos: ${context.parsed.y} clientes`;
          },
          afterBody: (items: any[]) => {
            const idx = items[0]?.dataIndex;
            const item = safeTimelineData[idx];
            if (item && item.growth !== undefined && item.growth !== 0) {
              return ` Crescimento vs anterior: ${item.growth > 0 ? '+' : ''}${item.growth}%`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 11, weight: 'bold' } },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          callback: (value: any) => `R$ ${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`,
          font: { size: 11 },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: {
          color: isDark ? '#a78bfa' : '#7c3aed',
          precision: 0,
          font: { size: 11 },
        },
      },
    },
  };

  // Handle Interactive Chart Click (Drill-Down / Filter Whole Component)
  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mainChartRef.current) return;
    const elements = getElementAtEvent(mainChartRef.current, event);
    if (!elements.length) return;

    const clickedIndex = elements[0].index;
    const clickedItem = safeTimelineData[clickedIndex];
    if (!clickedItem) return;

    if (granularity === 'year' && clickedItem.year) {
      setSelectedYear(clickedItem.year);
      setGranularity('month');
    } else if (granularity === 'month' && clickedItem.month) {
      setSelectedMonth(clickedItem.month);
      setGranularity('day');
      setSelectedDay(undefined);
    } else if (granularity === 'day' && clickedItem.day) {
      setSelectedDay(selectedDay === clickedItem.day ? undefined : clickedItem.day);
    }
  };

  // =========================================================================
  // 2. SECONDARY CHARTS (FILTERED BY ACTIVE SEGMENTATION)
  // =========================================================================
  const procedureLabels = safeProcedureStats.slice(0, 6).map((p) => p.procedure || 'Outro');
  const procedureRevenues = safeProcedureStats.slice(0, 6).map((p) => p.revenue || 0);
  const procedureColors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  const procedureChartData = {
    labels: procedureLabels.length > 0 ? procedureLabels : ['Sem dados'],
    datasets: [
      {
        data: procedureRevenues.length > 0 ? procedureRevenues : [1],
        backgroundColor: procedureColors.slice(0, procedureLabels.length || 1),
        borderWidth: 2,
        borderColor: isDark ? '#0f172a' : '#ffffff',
      },
    ],
  };

  const professionalLabels = safeProfessionalStats.map((p) => p.professional || 'Sem nome');
  const professionalRevenues = safeProfessionalStats.map((p) => p.revenue || 0);

  const professionalChartData = {
    labels: professionalLabels.length > 0 ? professionalLabels : ['Sem dados'],
    datasets: [
      {
        label: 'Faturamento (R$)',
        data: professionalRevenues.length > 0 ? professionalRevenues : [0],
        backgroundColor: ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
        borderRadius: 8,
      },
    ],
  };

  const paymentLabels = safePaymentMethodStats
    .filter((m) => m.revenue > 0)
    .map((m) => m.method || 'Outro');
  const paymentRevenues = safePaymentMethodStats
    .filter((m) => m.revenue > 0)
    .map((m) => m.revenue || 0);

  const paymentChartData = {
    labels: paymentLabels.length > 0 ? paymentLabels : ['Nenhum faturamento'],
    datasets: [
      {
        data: paymentRevenues.length > 0 ? paymentRevenues : [1],
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#94a3b8'],
        borderWidth: 2,
        borderColor: isDark ? '#0f172a' : '#ffffff',
      },
    ],
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setGranularity('month');
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedDay(undefined);
    setSelectedProfessional('Todos');
  };

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Erro ao carregar dados financeiros
        </h3>
        <p className="text-xs text-slate-400 mt-1">{error}</p>
        <button
          onClick={fetchReport}
          className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
          Tentar novamente
        </button>
      </div>
    );
  }

  // Loading state
  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-9 h-9 animate-spin mb-3 text-rose-500" />
        <p className="text-xs font-semibold">Carregando análise financeira e métricas de crescimento...</p>
      </div>
    );
  }

  const hasData = report && report.metrics && report.metrics.totalRevenue > 0;
  const growthRate = report?.metrics?.growthRate ?? 0;
  const isPositiveGrowth = growthRate >= 0;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & MAIN CONTROLS (TIME SEGMENTATION BAR) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Painel de Crescimento & Faturamento
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-200 dark:border-rose-800">
                  Chart.js
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Análise detalhada por Ano, Mês e Dias com filtragem integrada em todo o relatório
              </p>
            </div>
          </div>

          {/* Granularity Segmentation Selector (Year / Month / Day) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700/80">
              <button
                onClick={() => {
                  setGranularity('year');
                  setSelectedDay(undefined);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  granularity === 'year'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Por Ano</span>
              </button>

              <button
                onClick={() => {
                  setGranularity('month');
                  setSelectedDay(undefined);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  granularity === 'month'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Por Mês</span>
              </button>

              <button
                onClick={() => setGranularity('day')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  granularity === 'day'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Por Dia</span>
              </button>
            </div>

            {/* Year Selector */}
            <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Ano:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-800">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector (if in Month or Day granularity) */}
            {granularity !== 'year' && (
              <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Mês:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value, 10));
                    setSelectedDay(undefined);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value} className="bg-white dark:bg-slate-800">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Professional Filter */}
            <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-500" />
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="Todos" className="bg-white dark:bg-slate-800">
                  Todas as Profissionais
                </option>
                {professionals.map((p) => (
                  <option key={p._id} value={p.name} className="bg-white dark:bg-slate-800">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            <button
              onClick={handleResetFilters}
              title="Resetar filtros"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              title="Imprimir Relatório"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filter Scope Breadcrumb / Drill-down status */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-rose-500" /> Filtro ativo:
            </span>

            <button
              onClick={() => setGranularity('year')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                granularity === 'year'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {selectedYear}
            </button>

            {granularity !== 'year' && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <button
                  onClick={() => {
                    setGranularity('month');
                    setSelectedDay(undefined);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    granularity === 'month' && selectedDay === undefined
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {months[selectedMonth - 1]?.label}
                </button>
              </>
            )}

            {selectedDay !== undefined && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="px-2.5 py-1 rounded-lg font-bold bg-rose-500 text-white shadow-xs flex items-center gap-1">
                  Dia {selectedDay}
                </span>
                <button
                  onClick={() => setSelectedDay(undefined)}
                  className="text-[11px] text-rose-500 underline font-semibold ml-1 hover:text-rose-600"
                >
                  (Limpar dia)
                </button>
              </>
            )}

            {selectedProfessional !== 'Todos' && (
              <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold text-[11px] border border-purple-200 dark:border-purple-800">
                Profissional: {selectedProfessional}
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Dica: Clique nas barras/pontos do gráfico principal para filtrar diretamente
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO PRINCIPAL CHART (FULL WIDTH EVOLUTION WITH CHARTS.JS) */}
      {/* ========================================================================= */}
      <div
  id="main-evolution-chart-card"
  className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
>
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
    <div>
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-rose-500" />
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {granularity === 'year' && 'Evolução Anual do Estabelecimento (Crescimento por Ano)'}
          {granularity === 'month' && `Evolução Mensal do Faturamento em ${selectedYear}`}
          {granularity === 'day' && `Evolução Diária - ${months[selectedMonth - 1]?.label} de ${selectedYear}`}
        </h2>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        {granularity === 'year' && 'Compare o volume de atendimentos e receita gerada ano a ano.'}
        {granularity === 'month' && 'Curva de sazonalidade e picos de demanda ao longo dos 12 meses.'}
        {granularity === 'day' && 'Distribuição diária de faturamento e fluxo de clientes no mês.'}
      </p>
    </div>

    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        {safeTimelineData.length} pontos temporais
      </span>
    </div>
  </div>

  {/* ✅ Main Chart Canvas with interactive click - CORRIGIDO */}
  <div className="h-72 sm:h-80 w-full relative">
    <canvas
      onClick={handleChartClick}
      style={{ width: '100%', height: '100%', cursor: 'pointer' }}
    />
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <Chart
        type="line"
        ref={mainChartRef}
        data={mainEvolutionChartData as any}
        options={mainEvolutionChartOptions}
      />
    </div>
  </div>

  {/* Quick Granularity helper buttons below hero chart */}
  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
    <div className="flex items-center gap-2">
      <span className="font-semibold text-slate-700 dark:text-slate-300">Segmentar por:</span>
      <button
        onClick={() => {
          setGranularity('year');
          setSelectedDay(undefined);
        }}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
          granularity === 'year'
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-bold'
            : 'bg-transparent border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        Anos (2024 - 2027)
      </button>
      <button
        onClick={() => {
          setGranularity('month');
          setSelectedDay(undefined);
        }}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
          granularity === 'month'
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-bold'
            : 'bg-transparent border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        Meses de {selectedYear}
      </button>
      <button
        onClick={() => setGranularity('day')}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
          granularity === 'day'
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-bold'
            : 'bg-transparent border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        Dias de {months[selectedMonth - 1]?.label}
      </button>
    </div>

    <div className="flex items-center gap-3 font-medium text-[11px]">
      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
        <span className="w-3 h-0.5 bg-rose-500 rounded" /> Linha: Faturamento
      </span>
      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
        <span className="w-2.5 h-2.5 bg-purple-500 rounded-xs" /> Barras: Atendimentos
      </span>
    </div>
  </div>
</div>

      {/* ========================================================================= */}
      {/* 3. DYNAMIC KPI CARDS (UPDATING ACCORDING TO FILTERED SLICE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Faturamento Filtrado</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-2 tracking-tight">
            R$ {report?.metrics?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold">
            {growthRate !== 0 ? (
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                  isPositiveGrowth
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {isPositiveGrowth ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isPositiveGrowth ? '+' : ''}{growthRate}%
              </span>
            ) : (
              <span className="text-slate-400">Estável</span>
            )}
            <span className="text-slate-400">vs período anterior</span>
          </div>
        </div>

        {/* Completed Appointments */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Atendimentos Concluídos</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            {report?.metrics?.completedAppointments || 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Total de agendamentos: {report?.metrics?.totalAppointments || 0}
          </div>
        </div>

        {/* Average Ticket */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Ticket Médio por Cliente</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-2 tracking-tight">
            R$ {report?.metrics?.averageTicket?.toFixed(2) || '0.00'}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Média por procedimento no filtro
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Taxa de Conclusão</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            {(report?.metrics?.completionRate || 0).toFixed(1)}%
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Eficiência de atendimento
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SECONDARY CHARTS & RANKING (FILTERED BY ACTIVE TIME SLICE) */}
      {/* ========================================================================= */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Procedure Breakdown (Doughnut) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-rose-500" />
                Procedimentos Mais Rentáveis
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">No Filtro</span>
            </div>
            <div className="h-60 w-full relative">
              <Doughnut
                data={procedureChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        color: textColor,
                        font: { size: 10, weight: 'bold' },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Professional Revenue (Bar) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" />
                Faturamento por Profissional
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">No Filtro</span>
            </div>
            <div className="h-60 w-full relative">
              <Bar
                data={professionalChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: textColor, font: { size: 11, weight: 'bold' } } },
                    y: {
                      ticks: {
                        color: textColor,
                        callback: (v: any) => `R$ ${v}`,
                        font: { size: 10 },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Payment Methods (Pie) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Formas de Pagamento
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">No Filtro</span>
            </div>
            <div className="h-60 w-full relative">
              <Pie
                data={paymentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 12, color: textColor, font: { size: 10, weight: 'bold' } },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Detailed Procedure Ranking Table (Full width on bottom) */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                  Ranking Consolidado de Procedimentos & Serviços
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Volume total, participação na receita e faturamento gerado no período selecionado
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">#</th>
                    <th className="pb-3">Procedimento</th>
                    <th className="pb-3 text-center">Atendimentos</th>
                    <th className="pb-3 text-right">Faturamento Total</th>
                    <th className="pb-3 text-right pr-2">Participação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {safeProcedureStats.map((proc, idx) => (
                    <tr key={proc.procedure || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 pl-2">
                        <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold flex items-center justify-center text-[11px]">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {proc.procedure}
                      </td>
                      <td className="py-3 text-center font-medium text-slate-600 dark:text-slate-400">
                        {proc.count} {proc.count === 1 ? 'cliente' : 'clientes'}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        R$ {proc.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full"
                              style={{ width: `${Math.min(proc.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400 w-10 text-right">
                            {proc.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhum dado financeiro para o período filtrado
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Não há registros de atendimentos concluídos correspondentes aos filtros selecionados.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
            Resetar Filtros
          </button>
        </div>
      )}
    </div>
  );
};