import React, {useState} from 'react';
import {Calculator, Minus, Plus, X} from 'lucide-react';
import {FARE_RATES} from '../../lib/caracasData';

interface FareCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FareCalculatorModal: React.FC<FareCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [counts, setCounts] = useState<Record<string, number>>({
    camioneta: 2,
    metro: 0,
    metrobus: 0,
  });

  if (!isOpen) return null;

  const updateCount = (id: string, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(20, (prev[id] ?? 0) + delta)),
    }));
  };

  const totalBs = FARE_RATES.fares.reduce(
    (sum, item) => sum + item.fareBs * (counts[item.id] ?? 0),
    0
  );
  const totalUsd = totalBs / FARE_RATES.bcvRateBsPerUsd;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Calculadora de pasaje Caracas"
      className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0F172A] border border-slate-700/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Calculadora de Pasaje
              </h3>
              <p className="text-xs text-slate-400 font-mono-tabular">
                Tasa ref. BCV: {FARE_RATES.bcvRateBsPerUsd.toFixed(2)} Bs/$
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar calculadora"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Shortcuts */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setCounts({camioneta: 2, metro: 0, metrobus: 0})}
            className="min-h-[40px] rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Ida y vuelta
          </button>
          <button
            type="button"
            onClick={() => setCounts({camioneta: 1, metro: 1, metrobus: 1})}
            className="min-h-[40px] rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Combinado
          </button>
          <button
            type="button"
            onClick={() => setCounts({camioneta: 10, metro: 4, metrobus: 0})}
            className="min-h-[40px] rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Semana (5d)
          </button>
        </div>

        {/* Transport Rows */}
        <div className="divide-y divide-slate-800 rounded-2xl bg-slate-900/90 border border-slate-800">
          {FARE_RATES.fares.map((item) => {
            const qty = counts[item.id] ?? 0;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{backgroundColor: item.color}}
                    />
                    <span className="text-sm font-bold text-white truncate">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono-tabular">
                    {item.fareBs} Bs · {item.note}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCount(item.id, -1)}
                    aria-label={`Restar viaje en ${item.label}`}
                    className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 hover:bg-slate-700 active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-7 text-center font-mono-tabular font-bold text-white text-sm">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCount(item.id, 1)}
                    aria-label={`Sumar viaje en ${item.label}`}
                    className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 hover:bg-slate-700 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-300 font-medium">
              Total estimado
            </p>
            <p className="font-mono-tabular text-2xl font-extrabold text-white mt-0.5">
              {totalBs.toFixed(0)} Bs
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Equivalente USD</p>
            <p className="font-mono-tabular text-xl font-bold text-emerald-400 mt-0.5">
              ${totalUsd.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
