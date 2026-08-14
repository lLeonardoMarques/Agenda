import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
} from 'lucide-react';
import { Appointment, PaymentMethod } from '../types';

interface FinishAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirmFinish: (appointmentId: string, finalData: { price: number; paymentMethod: PaymentMethod; notes: string }) => Promise<void>;
}

export const FinishAppointmentModal: React.FC<FinishAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirmFinish,
}) => {
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setFinalPrice(appointment.price || 0);
      setPaymentMethod(
        appointment.paymentMethod && appointment.paymentMethod !== 'Pendente'
          ? appointment.paymentMethod
          : 'Pix'
      );
      setNotes(appointment.notes || '');
    }
  }, [appointment, isOpen]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onConfirmFinish(appointment._id, {
        price: Number(finalPrice),
        paymentMethod,
        notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const paymentOptions: { id: PaymentMethod; label: string; icon: any }[] = [
    { id: 'Pix', label: 'Pix', icon: QrCode },
    { id: 'Cartão de Crédito', label: 'Cartão de Crédito', icon: CreditCard },
    { id: 'Cartão de Débito', label: 'Cartão de Débito', icon: CreditCard },
    { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        id="finish-modal-container"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Concluir Atendimento
              </h3>
              <p className="text-[11px] text-slate-400">
                Toque da Beleza &bull; Registrar Receita
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Cliente</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {appointment.clientName}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Procedimento</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {appointment.procedure}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Profissional</span>
              <span className="font-medium text-rose-600 dark:text-rose-400">
                {appointment.professional}
              </span>
            </div>
          </div>

          {/* Final Price Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor Final Cobrado (R$) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <input
                id="input-finish-price"
                type="number"
                step="0.50"
                min="0"
                required
                value={finalPrice}
                onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-base font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Forma de Pagamento Realizada *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                      isSelected
                        ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-600 dark:text-rose-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações Finais do Atendimento
            </label>
            <input
              type="text"
              placeholder="Ex: Pagou taxa de escovação extra, gostou do corte..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-finish-service"
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Gravando no MongoDB Atlas...' : 'Concluir & Faturar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
