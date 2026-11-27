import React, {useState} from 'react';
import {Check, Copy, QrCode, Smartphone, X} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import type {ActiveUnit} from '../../types';

interface DriverQrModalProps {
  isOpen: boolean;
  unit: ActiveUnit;
  onClose: () => void;
}

export const DriverQrModal: React.FC<DriverQrModalProps> = ({
  isOpen,
  unit,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(null), 1600);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pantalla QR de cobro y validación"
      className="fixed inset-0 z-[1200] bg-[#0F172A] text-white flex flex-col justify-between p-5 sm:p-8 overflow-y-auto"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 max-w-lg w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <span className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </span>
          <div>
            <p className="font-mono-tabular text-lg font-extrabold text-white leading-none">
              {unit.unitCode}
            </p>
            <p className="text-xs text-slate-400 mt-1">{unit.routeName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar pantalla QR"
          className="min-h-[48px] min-w-[48px] rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-slate-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Giant Scannable QR Card */}
      <div className="my-6 max-w-lg w-full mx-auto rounded-3xl bg-white text-slate-950 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-4">
        <p className="font-display text-lg font-extrabold text-slate-900">
          Escanea para validar tu abordaje (+10 pts)
        </p>
        <div className="p-3 rounded-2xl border-4 border-slate-950 bg-white">
          <QRCodeSVG
            value={`ENCOLA:UNIT:${unit.unitCode}`}
            size={210}
            level="H"
          />
        </div>
        <p className="font-mono-tabular text-2xl font-extrabold tracking-widest text-emerald-700">
          {unit.unitCode}
        </p>
      </div>

      {/* Pago Móvil High-Contrast Block */}
      <div className="max-w-lg w-full mx-auto rounded-3xl bg-slate-900 border border-slate-700 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 font-display text-base font-bold text-amber-400">
            <Smartphone className="w-5 h-5" />
            Datos Pago Móvil
          </span>
          <span className="font-mono-tabular text-lg font-extrabold text-emerald-400">
            {unit.pagoMovil.fareBs} Bs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm">
          <button
            type="button"
            onClick={() => void copyText('bank', unit.pagoMovil.bank)}
            className="rounded-2xl bg-slate-800/90 border border-slate-700 p-3 text-left hover:bg-slate-800 transition"
          >
            <span className="text-[11px] text-slate-400 block">Banco</span>
            <span className="font-bold text-white flex items-center justify-between gap-1 mt-0.5">
              <span className="truncate">{unit.pagoMovil.bank}</span>
              {copiedField === 'bank' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void copyText('phone', unit.pagoMovil.phone)}
            className="rounded-2xl bg-slate-800/90 border border-slate-700 p-3 text-left hover:bg-slate-800 transition"
          >
            <span className="text-[11px] text-slate-400 block">Teléfono</span>
            <span className="font-mono-tabular font-bold text-white flex items-center justify-between gap-1 mt-0.5">
              <span className="truncate">{unit.pagoMovil.phone}</span>
              {copiedField === 'phone' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void copyText('id', unit.pagoMovil.idNumber)}
            className="rounded-2xl bg-slate-800/90 border border-slate-700 p-3 text-left hover:bg-slate-800 transition"
          >
            <span className="text-[11px] text-slate-400 block">Cédula / RIF</span>
            <span className="font-mono-tabular font-bold text-white flex items-center justify-between gap-1 mt-0.5">
              <span className="truncate">{unit.pagoMovil.idNumber}</span>
              {copiedField === 'id' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[54px] rounded-2xl bg-emerald-500 text-slate-950 font-display font-extrabold text-base hover:bg-emerald-400 active:scale-[0.98] transition"
        >
          Volver al Mapa de Demanda
        </button>
      </div>
    </div>
  );
};
