import React, {useState} from 'react';
import {CheckCircle2, QrCode, ScanLine, X} from 'lucide-react';
import type {ActiveUnit} from '../../types';

interface UnitQrScannerModalProps {
  isOpen: boolean;
  units: ActiveUnit[];
  onClose: () => void;
  onValidateCode: (code: string) => Promise<{ok: boolean; message: string}>;
}

export const UnitQrScannerModal: React.FC<UnitQrScannerModalProps> = ({
  isOpen,
  units,
  onClose,
  onValidateCode,
}) => {
  const [manualCode, setManualCode] = useState('UNIDAD-01');
  const [feedback, setFeedback] = useState<{ok: boolean; text: string} | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (code: string) => {
    setSubmitting(true);
    setFeedback(null);
    const res = await onValidateCode(code);
    setSubmitting(false);
    setFeedback({ok: res.ok, text: res.message});
    if (res.ok) {
      window.setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 900);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Escanear QR de unidad"
      className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0F172A] border border-slate-700 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Validar QR de Unidad
              </h3>
              <p className="text-xs text-slate-400">
                Desbloquea tus +10 pts pendientes al abordar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar escáner"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated Viewfinder Frame */}
        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 h-40 flex flex-col items-center justify-center overflow-hidden">
          <div className="w-28 h-28 rounded-2xl border-2 border-emerald-400/80 flex items-center justify-center relative">
            <ScanLine className="w-12 h-12 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Apunta al código QR en la puerta o toca una unidad activa
          </p>
        </div>

        {/* Quick-Tap Active Units for Instant Hackathon Demo */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-300">
            Unidades transmitiendo cerca de ti
          </p>
          <div className="grid grid-cols-3 gap-2">
            {units
              .filter((u) => u.isActive)
              .slice(0, 3)
              .map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmit(unit.unitCode)}
                  className="min-h-[46px] rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-400 text-xs font-mono-tabular font-bold text-white flex flex-col items-center justify-center active:scale-95 transition"
                >
                  <span>{unit.unitCode}</span>
                  <span className="text-[10px] font-sans font-normal text-slate-400">
                    {unit.transportType === 'metrobus' ? 'Metrobús' : 'Camioneta'}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Manual Code Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit(manualCode);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="Ej: UNIDAD-01"
            className="flex-1 min-h-[46px] px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono-tabular font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={submitting || !manualCode.trim()}
            className="min-h-[46px] px-4 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 active:scale-95 transition disabled:opacity-50"
          >
            Validar
          </button>
        </form>

        {feedback && (
          <div
            className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
              feedback.ok
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/40 text-red-300'
            }`}
          >
            {feedback.ok && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
