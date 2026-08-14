import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  Search,
  User,
  Phone,
  Scissors,
  DollarSign,
  CreditCard,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Appointment, Professional, ServiceItem } from '../types';
import { api } from '../lib/api';

interface HistoryViewProps {
  professionals: Professional[];
  services: ServiceItem[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ professionals, services }) => {
  const [historyItems, setHistoryItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedProfessional, setSelectedProfessional] = useState('Todos');
  const [selectedProcedure, setSelectedProcedure] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory({
        startDate,
        endDate,
        professional: selectedProfessional,
        procedure: selectedProcedure,
        status: statusFilter,
        search: searchTerm,
      });
      setHistoryItems(data);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate, selectedProfessional, selectedProcedure, statusFilter]);

  // Handle Quick Date Ranges
  const handleQuickRange = (range: '7days' | 'thisMonth' | 'lastMonth' | 'all') => {
    const now = new Date();
    if (range === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (range === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (range === 'lastMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (range === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Aggregated totals
  const totalCompleted = historyItems.filter((i) => i.status === 'Concluído').length;
  const totalRevenue = historyItems
    .filter((i) => i.status === 'Concluído')
    .reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const averageTicket = totalCompleted > 0 ? totalRevenue / totalCompleted : 0;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Histórico Geral de Atendimentos
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulte clientes atendidas, serviços passados e controle financeiro
              </p>
            </div>
          </div>

          {/* Quick Date Range Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleQuickRange('7days')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => handleQuickRange('thisMonth')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 text-white shadow-sm transition"
            >
              Este Mês
            </button>
            <button
              onClick={() => handleQuickRange('lastMonth')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              Mês Anterior
            </button>
            <button
              onClick={() => handleQuickRange('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              Tudo
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total no Período</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {historyItems.length} <span className="text-xs font-normal text-slate-500">registros</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Concluídas com Sucesso</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {totalCompleted}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Receita Total Filtrada</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
              R$ {totalRevenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ticket Médio por Cliente</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
              R$ {averageTicket.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Deep Filters & Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Data Inicial
            </label>
            <input
              id="input-history-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Data Final
            </label>
            <input
              id="input-history-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
            />
          </div>

          {/* Professional */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Profissional
            </label>
            <select
              id="select-history-professional"
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="Todos">Todas as Profissionais</option>
              {professionals.map((p) => (
                <option key={p._id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Status do Atendimento
            </label>
            <select
              id="select-history-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Concluído">Apenas Concluídos</option>
              <option value="Cancelado">Apenas Cancelados</option>
              <option value="Agendado">Agendados</option>
              <option value="Em Atendimento">Em Atendimento</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-input-history"
              type="text"
              placeholder="Buscar por cliente, telefone, procedimento ou anotações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
          <button
            id="btn-apply-history-filter"
            onClick={fetchHistory}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition shadow-sm"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Consultando histórico no MongoDB Atlas...</p>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhum histórico encontrado para os filtros selecionados
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tente ampliar o período de datas ou remover filtros específicos.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Data & Horário</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Procedimento</th>
                  <th className="py-3.5 px-4">Profissional</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Pagamento</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {historyItems.map((item) => {
                  const isExpanded = expandedId === item._id;
                  const formattedDate = new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR');

                  return (
                    <React.Fragment key={item._id}>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {formattedDate}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.time}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>{item.clientName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.clientPhone}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.procedure}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.durationMinutes} min</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-rose-600 dark:text-rose-400">
                            {item.professional}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                          R$ {item.price.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                            {item.paymentMethod}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.status === 'Concluído'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : item.status === 'Cancelado'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            id={`btn-toggle-expand-${item._id}`}
                            onClick={() => setExpandedId(isExpanded ? null : item._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                          <td colSpan={8} className="p-4 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Origem:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  {item.source || 'Toque da Beleza App'}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registrado em:</span>
                                <span className="font-mono text-slate-700 dark:text-slate-200">
                                  {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : 'Recente'}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Observações:</span>
                                <span className="italic text-slate-700 dark:text-slate-300">
                                  {item.notes || 'Sem anotações'}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
