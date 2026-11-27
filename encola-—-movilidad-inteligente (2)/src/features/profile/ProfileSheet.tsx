import React, {useState} from 'react';
import {motion} from 'motion/react';
import {
  ArrowLeftRight,
  BadgeCheck,
  Bus,
  LogOut,
  QrCode,
  Radio,
  ShieldCheck,
  Smartphone,
  Star,
  Ticket,
  User,
} from 'lucide-react';
import {PWAInstallButton} from '../../components/ui/PWAInstallButton';
import type {ActiveUnit, RedemptionTicket, UserProfile} from '../../types';

interface ProfileSheetProps {
  profile: UserProfile;
  driverUnit?: ActiveUnit;
  shiftValidatedPassengers?: number;
  redemptions: RedemptionTicket[];
  onSwitchToDriver: (unitCode: string) => void;
  onSwitchToPassenger: () => void;
  onToggleDriverRoute?: () => void;
  onOpenDriverQr?: () => void;
  onOpenTicket: (ticket: RedemptionTicket) => void;
  onSignOut: () => void;
}

export const ProfileSheet: React.FC<ProfileSheetProps> = ({
  profile,
  driverUnit,
  shiftValidatedPassengers = 28,
  redemptions,
  onSwitchToDriver,
  onSwitchToPassenger,
  onToggleDriverRoute,
  onOpenDriverQr,
  onOpenTicket,
  onSignOut,
}) => {
  const [unitCodeInput, setUnitCodeInput] = useState(
    profile.unitCode ?? driverUnit?.unitCode ?? 'UNIDAD-01'
  );

  // =========================================================================
  // DRIVER PROFILE VIEW
  // =========================================================================
  if (profile.role === 'driver' && driverUnit) {
    const fareBs = driverUnit.pagoMovil.fareBs;
    const estShiftBs = shiftValidatedPassengers * fareBs;

    return (
      <motion.div
        initial={{opacity: 0, y: 10}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.26, ease: [0.16, 1, 0.3, 1]}}
        className="space-y-5"
      >
        {/* Driver Identity Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400/80 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-display font-extrabold text-base flex items-center justify-center shrink-0">
                {profile.avatarInitials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-base font-extrabold text-white truncate">
                  {profile.fullName}
                </h3>
                <BadgeCheck className="w-4 h-4 text-sky-400 shrink-0" />
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {profile.email}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Star className="w-3 h-3 fill-amber-300" />
                  4.9
                </span>
                <span className="text-slate-600">·</span>
                <span className="font-mono-tabular">1.240 viajes</span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 font-semibold">Conductor</span>
              </div>
            </div>
          </div>

          {onToggleDriverRoute && (
            <button
              type="button"
              onClick={onToggleDriverRoute}
              className={`h-8 px-2.5 rounded-full border flex items-center gap-1.5 text-[11px] font-bold shrink-0 transition-colors ${
                driverUnit.isActive
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  : 'bg-white/[0.04] border-white/[0.1] text-slate-400'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>{driverUnit.isActive ? 'En Línea' : 'Pausado'}</span>
            </button>
          )}
        </div>

        {/* Shift Metrics Strip */}
        <div className="grid grid-cols-2 divide-x divide-white/[0.08] py-3.5 border-y border-white/[0.08]">
          <div className="pr-4">
            <span className="text-xs text-slate-400 block">Pasajeros hoy</span>
            <span className="font-mono-tabular text-2xl font-extrabold text-white mt-0.5 block">
              {shiftValidatedPassengers}
            </span>
            <span className="text-[11px] text-slate-400">
              validados en turno
            </span>
          </div>
          <div className="pl-4">
            <span className="text-xs text-slate-400 block">Recaudado hoy</span>
            <span className="font-mono-tabular text-2xl font-extrabold text-emerald-400 mt-0.5 block">
              {estShiftBs.toLocaleString('es-VE')} Bs
            </span>
            <span className="text-[11px] text-slate-400 font-mono-tabular">
              Tarifa: {fareBs} Bs
            </span>
          </div>
        </div>

        {/* Assigned Unit Card */}
        <div className="surface-elevated rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
                <Bus className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Unidad asignada</p>
                <p className="font-display text-sm font-bold text-white truncate">
                  {driverUnit.transportType === 'metrobus'
                    ? 'Metrobús'
                    : 'Camionetica'}{' '}
                  ·{' '}
                  <span className="font-mono-tabular text-amber-300">
                    {driverUnit.plate}
                  </span>
                </p>
              </div>
            </div>
            <span className="font-mono-tabular text-xs font-bold text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-lg shrink-0">
              {driverUnit.unitCode}
            </span>
          </div>

          <p className="text-xs text-slate-400 border-t border-white/[0.06] pt-2.5">
            Ruta activa:{' '}
            <span className="text-slate-200 font-medium">
              {driverUnit.routeName}
            </span>
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const clean = unitCodeInput.trim().toUpperCase() || 'UNIDAD-01';
              onSwitchToDriver(clean);
            }}
            className="flex gap-2 pt-1"
          >
            <input
              aria-label="Cambiar código de unidad"
              type="text"
              value={unitCodeInput}
              onChange={(e) => setUnitCodeInput(e.target.value.toUpperCase())}
              placeholder="UNIDAD-01"
              className="flex-1 min-h-[42px] px-3 rounded-xl bg-[#0C1017] border border-white/[0.09] font-mono-tabular font-bold text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="min-h-[42px] px-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs transition-colors whitespace-nowrap"
            >
              Cambiar unidad
            </button>
          </form>
        </div>

        {/* Driver Pago Móvil & QR Cobro Card */}
        <div className="surface-elevated rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-white">
              <Smartphone className="w-4 h-4 text-amber-400" />
              Datos de Cobro · Pago Móvil
            </span>
            <span className="font-mono-tabular text-xs font-bold text-emerald-400">
              {fareBs} Bs
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-[#0C1017] border border-white/[0.06] p-2.5">
              <span className="text-[10px] text-slate-400 block">Banco</span>
              <span className="font-semibold text-white truncate block mt-0.5">
                {driverUnit.pagoMovil.bank.split(' ')[0]}
              </span>
            </div>
            <div className="rounded-xl bg-[#0C1017] border border-white/[0.06] p-2.5">
              <span className="text-[10px] text-slate-400 block">Teléfono</span>
              <span className="font-mono-tabular font-semibold text-white truncate block mt-0.5">
                {driverUnit.pagoMovil.phone}
              </span>
            </div>
            <div className="rounded-xl bg-[#0C1017] border border-white/[0.06] p-2.5">
              <span className="text-[10px] text-slate-400 block">Cédula</span>
              <span className="font-mono-tabular font-semibold text-white truncate block mt-0.5">
                {driverUnit.pagoMovil.idNumber}
              </span>
            </div>
          </div>

          {onOpenDriverQr && (
            <button
              type="button"
              onClick={onOpenDriverQr}
              className="w-full min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <QrCode className="w-4 h-4" />
              <span>Mostrar QR de Cobro y Validación</span>
            </button>
          )}
        </div>

        {/* Role Switch & Sign Out */}
        <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onSwitchToPassenger}
            className="w-full min-h-[46px] px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <User className="w-4 h-4" />
            <span>Cambiar a Vista Pasajero</span>
          </button>

          <PWAInstallButton />

          <button
            type="button"
            onClick={onSignOut}
            className="w-full min-h-[44px] rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // =========================================================================
  // PASSENGER PROFILE VIEW
  // =========================================================================
  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.26, ease: [0.16, 1, 0.3, 1]}}
      className="space-y-6"
    >
      {/* Clean Passenger Identity Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-400/80 shadow-lg shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-400 text-slate-950 font-display font-extrabold text-base flex items-center justify-center shrink-0">
              {profile.avatarInitials}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-display text-base font-extrabold text-white truncate">
              {profile.fullName}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {profile.email} · {profile.isDemo ? 'Modo Demo' : 'Verificado'}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-400 shrink-0">
          Pasajero
        </span>
      </div>

      {/* Points Metric Strip */}
      <div className="grid grid-cols-2 divide-x divide-white/[0.08] py-3 border-y border-white/[0.08]">
        <div className="pr-4">
          <span className="text-xs text-slate-400 block">Confirmados</span>
          <span className="font-mono-tabular text-2xl font-extrabold text-emerald-400 mt-0.5 block">
            {profile.confirmedPoints} pts
          </span>
        </div>
        <div className="pl-4">
          <span className="text-xs text-slate-400 block">Pendientes</span>
          <span className="font-mono-tabular text-2xl font-extrabold text-amber-400 mt-0.5 block">
            {profile.pendingPoints} pts
          </span>
        </div>
      </div>

      {/* Switch to Driver */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-sky-400 shrink-0" />
          <h4 className="font-display text-sm font-bold text-white">
            Cambiar rol de operación
          </h4>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const clean = unitCodeInput.trim().toUpperCase() || 'UNIDAD-01';
            onSwitchToDriver(clean);
          }}
          className="space-y-2.5"
        >
          <label
            htmlFor="driver-unit-code"
            className="text-xs text-slate-400 block"
          >
            Ingresa el código de unidad para pasar a Cabina Conductor
          </label>
          <div className="flex gap-2">
            <input
              id="driver-unit-code"
              type="text"
              value={unitCodeInput}
              onChange={(e) => setUnitCodeInput(e.target.value.toUpperCase())}
              placeholder="UNIDAD-01"
              className="flex-1 min-h-[46px] px-3.5 rounded-xl bg-white/[0.05] border border-white/12 font-mono-tabular font-bold text-sm text-white focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="min-h-[46px] px-4 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-300 active:scale-95 transition whitespace-nowrap"
            >
              <Bus className="w-4 h-4" />
              <span>Conductor</span>
            </button>
          </div>
        </form>
      </div>

      {/* Redeemed Tickets History */}
      {redemptions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/[0.08]">
          <h4 className="text-xs font-bold text-slate-300">
            Mis boletos canjeados
          </h4>
          <div className="divide-y divide-white/[0.06]">
            {redemptions.slice(0, 3).map((ticket) => {
              const isValid = ticket.expiresAt > Date.now();
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => onOpenTicket(ticket)}
                  className="w-full py-2.5 flex items-center justify-between gap-2 text-left hover:bg-white/[0.04] px-2 -mx-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Ticket className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {ticket.merchantName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono-tabular">
                        {ticket.code} · -{ticket.pointsSpent} pts
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold shrink-0 ${
                      isValid ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {isValid ? 'Activo' : 'Expirado'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PWA Install & Sign Out */}
      <div className="space-y-3 pt-2 border-t border-white/[0.08]">
        <PWAInstallButton />

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Puntos verificados en cada viaje con EnCola</span>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full min-h-[46px] rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </motion.div>
  );
};
