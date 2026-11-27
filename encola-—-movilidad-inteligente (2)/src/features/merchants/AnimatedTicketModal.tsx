import React, {useEffect, useState} from 'react';
import {CheckCircle2, Clock, ShieldCheck, Ticket, X} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import {formatCountdown} from '../../lib/geo';
import type {RedemptionTicket} from '../../types';

interface AnimatedTicketModalProps {
  ticket: RedemptionTicket | null;
  onClose: () => void;
}

export const AnimatedTicketModal: React.FC<AnimatedTicketModalProps> = ({
  ticket,
  onClose,
}) => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!ticket) return;
    setNow(Date.now());
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => window.clearInterval(interval);
  }, [ticket]);

  if (!ticket) return null;

  const totalDurationMs = 3 * 60 * 1000;
  const remainingMs = Math.max(0, ticket.expiresAt - now);
  const progressPct = Math.max(
    0,
    Math.min(100, (remainingMs / totalDurationMs) * 100)
  );
  const isExpired = remainingMs <= 0;

  const liveClock = new Date(now).toLocaleTimeString('es-VE', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Boleto digital de canje presencial"
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div className="relative w-full max-w-sm rounded-[28px] bg-[#0B1221] border border-amber-400/50 shadow-[0_32px_80px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Holographic Anti-Screenshot Header Pass */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 px-5 py-4 text-slate-950">
          <div
            aria-hidden="true"
            className="ticket-shimmer-bar pointer-events-none absolute inset-y-0 w-24 bg-white/55 blur-md"
          />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 shrink-0" />
              <span className="font-display font-extrabold text-sm">
                Pase Digital · Anti-Captura
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar boleto"
              className="w-9 h-9 rounded-xl bg-slate-950/15 hover:bg-slate-950/25 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative z-10 mt-2 flex items-center justify-between text-xs font-mono-tabular font-bold">
            <span>Reloj en vivo · {liveClock}</span>
            <span>-{ticket.pointsSpent} pts</span>
          </div>
        </div>

        {/* Merchant Offer Section */}
        <div className="px-6 pt-5 pb-4 text-center space-y-1">
          <span className="text-3xl block" aria-hidden="true">
            {ticket.merchantEmoji}
          </span>
          <h3 className="font-display text-lg font-extrabold text-white leading-tight">
            {ticket.merchantName}
          </h3>
          <p className="text-xs text-slate-400">{ticket.referenceStop}</p>
          <p className="text-sm font-bold text-amber-300 pt-1">
            {ticket.offerTitle}
          </p>
        </div>

        {/* Perforated Pass Divider with Side Cutouts */}
        <div className="relative flex items-center py-2">
          <span className="w-5 h-5 -ml-2.5 rounded-full bg-black/85 border-r border-amber-400/40 shrink-0" />
          <div className="flex-1 border-t-2 border-dashed border-white/15 mx-2" />
          <span className="w-5 h-5 -mr-2.5 rounded-full bg-black/85 border-l border-amber-400/40 shrink-0" />
        </div>

        {/* Code + Scannable QR + 3:00 Timer */}
        <div className="px-6 pt-2 pb-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-400">
              Código único para validar en caja
            </span>
            <div className="font-mono-tabular text-[38px] leading-none font-extrabold tracking-[0.22em] text-white select-all">
              {ticket.code}
            </div>
            <div className="p-3 rounded-2xl bg-white shadow-inner">
              <QRCodeSVG
                value={`ENCOLA:REDEEM:${ticket.code}:${ticket.merchantId}`}
                size={118}
                level="M"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-300 font-semibold">
                <Clock className="w-4 h-4 text-amber-400" />
                {isExpired ? 'Boleto expirado' : 'Tiempo restante'}
              </span>
              <span
                className={`font-mono-tabular text-lg font-extrabold ${
                  isExpired || remainingMs < 45000
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatCountdown(remainingMs)}
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  isExpired || remainingMs < 45000
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-amber-400 to-emerald-400'
                }`}
                style={{width: `${progressPct}%`}}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Animación activa · No válido en captura de pantalla</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl bg-white/[0.08] hover:bg-white/[0.13] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Listo, cerrar boleto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
