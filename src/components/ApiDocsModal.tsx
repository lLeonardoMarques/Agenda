import React, { useState } from 'react';
import {
  X,
  Code2,
  Database,
  Server,
  Terminal,
  Copy,
  Check,
  Smartphone,
  BookOpen,
} from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'endpoints' | 'clientIntegration' | 'curl'>('architecture');

  if (!isOpen) return null;

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const samplePayloadBooking = `{
  "clientName": "Camila Vasconcelos",
  "clientPhone": "(11) 98888-4444",
  "procedure": "Mechas / Luzes & Tonalização",
  "professional": "Flávia",
  "price": 380,
  "date": "2026-08-15",
  "time": "14:30",
  "durationMinutes": 180,
  "paymentMethod": "Pendente",
  "notes": "Agendado via App Cliente Online - Toque da Beleza"
}`;

  const sampleCurl = `curl -X POST https://seu-dominio.com/api/integration/webhook/booking \\
  -H "Content-Type: application/json" \\
  -d '${samplePayloadBooking.replace(/\n/g, '')}'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div
        id="api-docs-modal-container"
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  Documentação da API REST & Integração
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  MongoDB Atlas Conectado
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toque da Beleza &bull; Banco de Dados: <code className="text-rose-600 dark:text-rose-400 font-mono">flavia</code> no <code className="text-rose-600 dark:text-rose-400 font-mono">Cluster0</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-4 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'architecture'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            1. Servidor Express & MongoDB
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'endpoints'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            2. Endpoints REST
          </button>
          <button
            onClick={() => setActiveTab('clientIntegration')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'clientIntegration'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            3. Integração com App dos Clientes
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300 flex-1">
          {/* TAB 1: Architecture & Server Setup */}
          {activeTab === 'architecture' && (
            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-rose-500" />
                  <span>Configuração do Banco MongoDB Atlas</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  O backend Express conecta diretamente ao Cluster0 utilizando o banco <strong>flavia</strong>. Todos os agendamentos, clientes, procedimentos e receitas são persistidos em coleções indexadas.
                </p>
                <div className="mt-3 bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl overflow-x-auto flex items-center justify-between">
                  <code>
                    mongodb+srv://dev:dev123@cluster0.oflxvxo.mongodb.net/flavia?retryWrites=true&w=majority&appName=Cluster0
                  </code>
                  <button
                    onClick={() =>
                      handleCopy(
                        'mongodb+srv://dev:dev123@cluster0.oflxvxo.mongodb.net/flavia?retryWrites=true&w=majority&appName=Cluster0',
                        'mongoUri'
                      )
                    }
                    className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {copiedSection === 'mongoUri' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-rose-500" />
                  <span>Como o Servidor Express foi construído</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                  <li>
                    <strong>Node.js + Express 4.x</strong>: Framework REST robusto com middleware JSON e tratamento de CORS/rotas.
                  </li>
                  <li>
                    <strong>Mongoose ODM</strong>: Modelagem de esquemas estruturados para <code className="font-mono text-rose-600">Appointment</code>, <code className="font-mono text-rose-600">Service</code> e <code className="font-mono text-rose-600">Professional</code>.
                  </li>
                  <li>
                    <strong>Agregações para Chart.js</strong>: Endpoint <code className="font-mono text-rose-600">/api/reports/financial</code> que processa somatórios diários, distribuição percentual de procedimentos e divisão por profissional.
                  </li>
                  <li>
                    <strong>Seed Automático</strong>: No primeiro start do banco <code className="font-mono">flavia</code>, popula automaticamente serviços de cabeleireira (Corte, Mechas, Botox, Escova) e o perfil da <strong>Flávia</strong>.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: All Endpoints */}
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {/* GET /api/status */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      GET
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">/api/status</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Verifica a integridade do servidor e conexão com o banco <code className="font-mono">flavia</code> no MongoDB Atlas.
                  </p>
                </div>

                {/* GET /api/appointments */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      GET
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">/api/appointments</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Lista agendamentos. Suporta filtros: <code className="font-mono text-rose-600">date</code>, <code className="font-mono text-rose-600">status</code>, <code className="font-mono text-rose-600">professional</code>, <code className="font-mono text-rose-600">search</code>, <code className="font-mono text-rose-600">month</code>, <code className="font-mono text-rose-600">year</code>.
                  </p>
                </div>

                {/* POST /api/appointments */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      POST
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">/api/appointments</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cria novo agendamento com validação de campos obrigatórios (nome, telefone, procedimento, data, hora).
                  </p>
                </div>

                {/* PUT /api/appointments/:id */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      PUT
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">/api/appointments/:id</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Atualiza status, horário, observações ou pagamento de um agendamento.
                  </p>
                </div>

                {/* GET /api/reports/financial */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      GET
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">/api/reports/financial?month=8&year=2026&professional=Flavia</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Gera dados agregados prontos para alimentar gráficos Chart.js (faturamento diário, divisão por categoria, ticket médio, etc.).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Client App Integration */}
          {activeTab === 'clientIntegration' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-rose-500" />
                  <span>Webhook de Entrada para App de Clientes</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Quando você lançar o app dedicado aos clientes para auto-agendamento, configure o app externo para enviar requisições POST para o endpoint abaixo:
                </p>

                <div className="mt-3 bg-slate-900 text-slate-200 font-mono text-xs p-3 rounded-xl overflow-x-auto relative">
                  <pre className="text-emerald-400">{samplePayloadBooking}</pre>
                  <button
                    onClick={() => handleCopy(samplePayloadBooking, 'payload')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {copiedSection === 'payload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-rose-500" />
                  Exemplo de Envio com cURL:
                </h5>
                <div className="bg-slate-900 text-slate-300 font-mono text-xs p-3 rounded-xl overflow-x-auto flex items-center justify-between">
                  <code>{sampleCurl}</code>
                  <button
                    onClick={() => handleCopy(sampleCurl, 'curl')}
                    className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {copiedSection === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 transition shadow-sm"
          >
            Fechar Documentação
          </button>
        </div>
      </div>
    </div>
  );
};
