import React, {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Ban,
  Check,
  ChevronDown,
  Navigation,
  Play,
  QrCode,
  ShieldAlert,
  Square,
  Users,
} from 'lucide-react';
import type {
  ActiveUnit,
  OccupancyStatus,
  RoadAlertType,
  TransitStop,
} from '../../types';

interface DriverControlsSheetProps {
  driverUnit: ActiveUnit;
  stops: TransitStop[];
  currentStop: TransitStop;
  nextStop: TransitStop;
  driverDirection: 1 | -1;
  shiftValidatedPassengers: number;
  onAdvanceToNextStop: () => void;
  onToggleDriverDirection: (dir: 1 | -1) => void;
  onToggleRouteActive: () => void;
  onChangeOccupancy: (status: OccupancyStatus) => void;
  onFocusStop: (stop: TransitStop) => void;
  onReportAlert: (type: RoadAlertType, label: string) => void;
  onOpenQrModal: () => void;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const OCCUPANCY_OPTIONS: {
  id: OccupancyStatus;
  title: string;
  Icon: React.FC<{className?: string}>;
  thumbClass: string;
  activeTextClass: string;
}[] = [
  {
    id: 'libre',
    title: 'Libres',
    Icon: Check,
    thumbClass: 'bg-emerald-500',
    activeTextClass: 'text-slate-950',
  },
  {
    id: 'de_pie',
    title: 'De Pie',
    Icon: Users,
    thumbClass: 'bg-amber-400',
    activeTextClass: 'text-slate-950',
  },
  {
    id: 'full',
    title: 'Full',
    Icon: Ban,
    thumbClass: 'bg-red-500',
    activeTextClass: 'text-white',
  },
];

const QUICK_ALERTS: {
  type: RoadAlertType;
  shortLabel: string;
  fullLabel: string;
  Icon: React.FC<{className?: string}>;
  iconColor: string;
}[] = [
  {
    type: 'traffic',
    shortLabel: 'Tráfico fuerte',
    fullLabel: 'Tráfico fuerte en el canal',
    Icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  {
    type: 'full',
    shortLabel: 'Unidad llena',
    fullLabel: 'Unidad llena (sin puestos)',
    Icon: Users,
    iconColor: 'text-red-400',
  },
  {
    type: 'detour',
    shortLabel: 'Desvío en vía',
    fullLabel: 'Desvío activo en el corredor',
    Icon: Navigation,
    iconColor: 'text-sky-400',
  },
  {
    type: 'checkpoint',
    shortLabel: 'Alcabala / Control',
    fullLabel: 'Alcabala / Punto de control vial',
    Icon: ShieldAlert,
    iconColor: 'text-emerald-400',
  },
];

export const DriverControlsSheet: React.FC<DriverControlsSheetProps> = ({
  driverUnit,
  stops,
  currentStop,
  nextStop,
  driverDirection,
  shiftValidatedPassengers,
  onAdvanceToNextStop,
  onToggleDriverDirection,
  onToggleRouteActive,
  onChangeOccupancy,
  onFocusStop,
  onReportAlert,
  onOpenQrModal,
}) => {
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);

  const orderedStops =
    driverDirection === 1 ? stops : [...stops].reverse();
  const currentOrderedIdx = orderedStops.findIndex(
    (s) => s.id === currentStop.id
  );
  const totalCorridorWaiting = stops.reduce(
    (sum, st) => sum + st.waitingCount,
    0
  );

  const capacity = driverUnit.transportType === 'metrobus' ? 40 : 24;
  const onboardCount =
    driverUnit.occupancy === 'libre'
      ? 11
      : driverUnit.occupancy === 'de_pie'
        ? 21
        : capacity;
  const occupancyPct = Math.round((onboardCount / capacity) * 100);
  const seatsAvailable = Math.max(0, capacity - onboardCount);
  const estShiftBs = shiftValidatedPassengers * driverUnit.pagoMovil.fareBs;
  const nextIsHighDemand = nextStop.waitingCount >= 12;

  return (
    <motion.div
      initial={{opacity: 0, y: 6}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.22, ease: EASE}}
      className="space-y-4"
    >
      {/* Inline Direction & Unit Bar */}
      <div className="flex items-center justify-between gap-2 bg-[#131924] border border-white/[0.06] rounded-xl px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {driverUnit.plate} ·{' '}
            <span className="text-amber-300">
              {driverDirection === 1 ? 'Sentido Petare →' : '← Sentido Plz. Vzla'}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggleDriverDirection(driverDirection === 1 ? -1 : 1)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 shrink-0 transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Invertir</span>
        </button>
      </div>

      {/* Serene Dual Cockpit Hero Card: Next Stop Queue + Onboard Info */}
      <div className="surface-elevated rounded-2xl p-4 space-y-3.5">
        <div className="grid grid-cols-2 divide-x divide-white/[0.08]">
          <button
            type="button"
            onClick={() => onFocusStop(nextStop)}
            className="pr-3 text-left"
          >
            <span className="text-[11px] text-slate-400 block truncate">
              Fila en {nextStop.name.split(' ')[0]}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <motion.span
                key={nextStop.waitingCount}
                initial={{opacity: 0.4, y: -3}}
                animate={{opacity: 1, y: 0}}
                className={`font-mono-tabular text-3xl font-bold leading-none ${
                  nextIsHighDemand ? 'text-red-400' : 'text-amber-300'
                }`}
              >
                {nextStop.waitingCount}
              </motion.span>
              <span className="text-xs text-slate-400 font-medium">pers.</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {nextIsHighDemand ? 'Alta demanda' : 'Próxima parada'}
            </p>
          </button>

          <div className="pl-3">
            <span className="text-[11px] text-slate-400 block">
              Pasajeros a bordo
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <motion.span
                key={onboardCount}
                initial={{opacity: 0.4, y: -3}}
                animate={{opacity: 1, y: 0}}
                className="font-mono-tabular text-3xl font-bold text-white leading-none"
              >
                {onboardCount}
              </motion.span>
              <span className="font-mono-tabular text-xs font-semibold text-slate-500">
                /{capacity}
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1.5 font-mono-tabular">
              {seatsAvailable} libres · {estShiftBs} Bs
            </p>
          </div>
        </div>

        <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
          <motion.div
            animate={{width: `${occupancyPct}%`}}
            transition={{type: 'spring', stiffness: 220, damping: 26}}
            className={`h-full rounded-full ${
              driverUnit.occupancy === 'libre'
                ? 'bg-emerald-500'
                : driverUnit.occupancy === 'de_pie'
                  ? 'bg-amber-400'
                  : 'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* Clean 1-Tap Occupancy Switch */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#131924] border border-white/[0.06]">
        {OCCUPANCY_OPTIONS.map((opt) => {
          const isSelected = driverUnit.occupancy === opt.id;
          const IconComp = opt.Icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeOccupancy(opt.id)}
              className={`relative min-h-[44px] rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${
                isSelected
                  ? opt.activeTextClass
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="cleanOccupancyThumb"
                  transition={{type: 'spring', stiffness: 440, damping: 32}}
                  className={`absolute inset-0 rounded-lg ${opt.thumbClass}`}
                />
              )}
              <IconComp className="relative z-10 w-3.5 h-3.5 stroke-[2.3]" />
              <span className="relative z-10">{opt.title}</span>
            </button>
          );
        })}
      </div>

      {/* Primary Driver Actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <motion.button
          type="button"
          whileTap={{scale: 0.97}}
          onClick={onAdvanceToNextStop}
          className="min-h-[46px] px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Navigation className="w-4 h-4 shrink-0" />
          <span className="truncate">Avanzar parada</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{scale: 0.97}}
          onClick={onOpenQrModal}
          className="min-h-[46px] px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <QrCode className="w-4 h-4 shrink-0" />
          <span>QR Pago Móvil</span>
        </motion.button>
      </div>

      {/* Next 3 Stops Quick Demand Grid */}
      {(() => {
        const nextThree = orderedStops
          .slice(currentOrderedIdx + 1, currentOrderedIdx + 4);
        if (nextThree.length === 0) return null;
        return (
          <div className="grid grid-cols-3 gap-2">
            {nextThree.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onFocusStop(st)}
                className="rounded-xl bg-[#131924] hover:bg-[#1B2435] border border-white/[0.06] p-2.5 text-center transition-colors"
              >
                <p className="text-[11px] font-medium text-slate-300 truncate">
                  {st.name}
                </p>
                <p
                  className={`font-mono-tabular text-lg font-extrabold mt-0.5 leading-none ${
                    st.waitingCount >= 14 ? 'text-red-400' : 'text-amber-300'
                  }`}
                >
                  {st.waitingCount}
                </p>
                <span className="text-[10px] text-slate-500">en cola</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* Full Queue Breakdown by Stop along Corridor */}
      <section className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">
            Pasajeros en cola por parada
          </span>
          <span className="font-mono-tabular text-[11px] font-semibold text-amber-300">
            {totalCorridorWaiting} total
          </span>
        </div>
        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {orderedStops.map((st, idx) => {
            const isCurrent = st.id === currentStop.id;
            const isNext = st.id === nextStop.id;
            const isPassed = idx < currentOrderedIdx;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onFocusStop(st)}
                className={`w-full py-2.5 flex items-center justify-between gap-2 text-left hover:bg-white/[0.03] px-1.5 -mx-1.5 rounded-lg transition-colors ${
                  isPassed ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isCurrent
                        ? 'bg-sky-400'
                        : isNext
                          ? 'bg-amber-400'
                          : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-sm font-medium text-white truncate">
                    {st.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-sky-400 shrink-0">
                      Actual
                    </span>
                  )}
                  {isNext && !isCurrent && (
                    <span className="text-[10px] font-semibold text-amber-400 shrink-0">
                      Próxima
                    </span>
                  )}
                </div>
                <span
                  className={`font-mono-tabular text-xs font-bold shrink-0 ${
                    st.waitingCount >= 12 ? 'text-red-400' : 'text-amber-300'
                  }`}
                >
                  {st.waitingCount} en fila
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Collapsible Quick Road Alerts & Route Status */}
      <div className="pt-2 border-t border-white/[0.06] space-y-2">
        <button
          type="button"
          onClick={() => setShowAlertsDrawer((prev) => !prev)}
          className="w-full py-1.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Reportar alerta vial (1 toque)
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              showAlertsDrawer ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {showAlertsDrawer && (
            <motion.div
              initial={{opacity: 0, height: 0}}
              animate={{opacity: 1, height: 'auto'}}
              exit={{opacity: 0, height: 0}}
              transition={{duration: 0.22, ease: EASE}}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 pb-2">
                {QUICK_ALERTS.map(
                  ({type, shortLabel, fullLabel, Icon, iconColor}) => (
                    <motion.button
                      key={type}
                      type="button"
                      whileTap={{scale: 0.96}}
                      onClick={() => onReportAlert(type, fullLabel)}
                      className="min-h-[40px] px-3 rounded-xl bg-[#131924] hover:bg-[#1B2435] border border-white/[0.06] text-left flex items-center gap-2 transition-colors"
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {shortLabel}
                      </span>
                    </motion.button>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onToggleRouteActive}
          className={`w-full min-h-[42px] px-4 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
            driverUnit.isActive
              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300'
              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {driverUnit.isActive ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            {driverUnit.isActive ? 'Finalizar ruta en vivo' : 'Iniciar ruta'}
          </span>
          <span className="font-mono-tabular">
            {driverUnit.isActive ? `${driverUnit.speedKmh} km/h` : 'OFF'}
          </span>
        </button>
      </div>
    </motion.div>
  );
};
