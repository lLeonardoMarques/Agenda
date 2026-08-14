import React from 'react';
import {
  Sparkles,
  Calendar,
  History,
  TrendingUp,
  Scissors,
  Code2,
  Sun,
  Moon,
  Database,
  PlusCircle,
  Smartphone,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'agenda' | 'history' | 'reports' | 'services';
  setActiveTab: (tab: 'agenda' | 'history' | 'reports' | 'services') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onOpenNewAppointment: () => void;
  onOpenApiDocs: () => void;
  dbStatus: {
    connected: boolean;
    cluster: string;
    databaseName: string;
  } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onOpenNewAppointment,
  onOpenApiDocs,
  dbStatus,
}) => {
  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-200 bg-white/90 border-pink-100 dark:bg-slate-900/90 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center shadow-md shadow-pink-500/20 text-white font-serif">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-800 dark:text-pink-100">
                  Toque da Beleza
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                  Cabeleireira Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Gestão Integrada &bull; Flávia
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              id="nav-tab-agenda"
              onClick={() => setActiveTab('agenda')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'agenda'
                  ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda de Clientes</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Histórico</span>
            </button>

            <button
              id="nav-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'reports'
                  ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Faturamento & Gráficos</span>
            </button>

            <button
              id="nav-tab-services"
              onClick={() => setActiveTab('services')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'services'
                  ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Serviços</span>
            </button>
          </nav>

          {/* Right Action Tools: Database, API Docs, Theme, Add Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Database indicator badge */}
            <div
              title={
                dbStatus?.connected
                  ? `MongoDB Atlas Conectado: Banco "${dbStatus.databaseName}" no ${dbStatus.cluster}`
                  : 'Tentando conectar ao MongoDB Atlas...'
              }
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                dbStatus?.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {dbStatus?.connected ? 'Atlas: flavia' : 'Atlas: Conectando...'}
              </span>
              <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </div>

            {/* API Docs & External App Webhook Button */}
            <button
              id="btn-api-docs"
              onClick={onOpenApiDocs}
              title="Ver documentação da API REST & Integração com App Cliente"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden sm:inline">API & Integração</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              id="btn-theme-toggle"
              onClick={() => setIsDark(!isDark)}
              aria-label="Alternar tema"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {/* Quick Add Appointment Button */}
            <button
              id="btn-header-new-appointment"
              onClick={onOpenNewAppointment}
              className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-md shadow-pink-500/25 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Horário</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
