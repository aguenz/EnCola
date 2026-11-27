import React from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  ChevronRight,
  Gauge,
  MapPin,
  QrCode,
  ShieldCheck,
  Store,
  TrainFront,
  Users,
} from 'lucide-react';
import type {ProofOfTransitState} from '../../hooks/useProofOfTransit';
import {AV_FRANCISCO_DE_MIRANDA_ROUTE} from '../../lib/caracasData';
import type {ActiveUnit, Merchant, RoadAlert, TransitStop} from '../../types';

interface PassengerRouteSheetProps {
  stops: TransitStop[];
  units: ActiveUnit[];
  originStop: TransitStop;
  destinationStop: TransitStop;
  proof: ProofOfTransitState;
  roadAlerts: RoadAlert[];
  nearbyMerchant: Merchant | null;
  onSelectDestinationStop: (stop: TransitStop) => void;
  onSelectStop: (stop: TransitStop) => void;
  onCheckInClick: () => void;
  onOpenQrScanner: () => void;
  onOpenFareCalculator: () => void;
  onOpenMerchantsTab: () => void;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ROUTE_MAX_INDEX = AV_FRANCISCO_DE_MIRANDA_ROUTE.length - 1;

function getOccupancyText(occ: ActiveUnit['occupancy']) {
  if (occ === 'libre') {
    return {label: 'Asientos libres', colorClass: 'text-emerald-400'};
  }
  if (occ === 'de_pie') {
    return {label: 'De pie', colorClass: 'text-amber-400'};
  }
  return {label: 'Full', colorClass: 'text-red-400'};
}

function getMetroMeta(status: TransitStop['metroStatus']) {
  if (status === 'fluido') {
    return {label: 'Fluido', colorClass: 'text-emerald-400', eta: '4m'};
  }
  if (status === 'retraso') {
    return {label: 'Retraso', colorClass: 'text-amber-400', eta: '11m'};
  }
  return {label: 'Cerrado', colorClass: 'text-red-400', eta: '—'};
}

export function estimateUnitEtaMin(unit: ActiveUnit, stop: TransitStop): number {
  const stopNorm = stop.routeIndex / ROUTE_MAX_INDEX;
  const distNorm = Math.abs(unit.routeProgress - stopNorm);
  return Math.max(1, Math.round(distNorm * 18 + 1));
}

export const PassengerRouteSheet: React.FC<PassengerRouteSheetProps> = ({
  stops,
  units,
  originStop,
  destinationStop,
  proof,
  roadAlerts,
  nearbyMerchant,
  onSelectDestinationStop,
  onSelectStop,
  onCheckInClick,
  onOpenQrScanner,
  onOpenFareCalculator,
  onOpenMerchantsTab,
}) => {
  const isNearStop = proof.distanceToNearestStopM <= 50;
  const metroInfo = getMetroMeta(originStop.metroStatus);
  const activeUnits = units.filter((u) => u.isActive);

  const sortedUnits = [...activeUnits].sort(
    (a, b) =>
      estimateUnitEtaMin(a, originStop) - estimateUnitEtaMin(b, originStop)
  );
  const nextUnit = sortedUnits[0];
  const waitMinutes = nextUnit ? estimateUnitEtaMin(nextUnit, originStop) : 5;

  const originIdx = stops.findIndex((s) => s.id === originStop.id);
  const destIdx = stops.findIndex((s) => s.id === destinationStop.id);
  const stopsBetween = Math.max(1, Math.abs(destIdx - originIdx));
  const tripDurationMin = stopsBetween * 4 + 2;

  const destinationOptions = stops.filter((s) => s.id !== originStop.id);

  const distPct = Math.min(
    100,
    Math.round((proof.distanceFromPendingStopM / 150) * 100)
  );
  const speedPct = Math.min(100, Math.round((proof.currentSpeedKmh / 15) * 100));

  return (
    <motion.div
      initial={{opacity: 0, y: 6}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.22, ease: EASE}}
      className="space-y-4"
    >
      {/* Inline Destination Selector (No extra screen needed) */}
      <div className="flex items-center justify-between gap-2.5 bg-[#131924] border border-white/[0.06] rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5 min-w-0 text-xs">
          <span className="text-slate-400 shrink-0">Hacia</span>
          <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <select
            aria-label="Seleccionar parada destino"
            value={destinationStop.id}
            onChange={(e) => {
              const target = stops.find((s) => s.id === e.target.value);
              if (target) onSelectDestinationStop(target);
            }}
            className="bg-transparent text-sky-300 font-semibold text-xs focus:outline-none cursor-pointer truncate pr-1"
          >
            {destinationOptions.map((st) => (
              <option
                key={st.id}
                value={st.id}
                className="bg-[#131924] text-white"
              >
                {st.name}
              </option>
            ))}
          </select>
        </div>
        <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0">
          {stopsBetween} {stopsBetween === 1 ? 'parada' : 'paradas'} · ~
          {tripDurationMin}m
        </span>
      </div>

      {/* Serene Two-Metric Summary Card (Waiting Time & Queue) */}
      <div className="surface-elevated rounded-2xl p-4 space-y-3.5">
        <div className="grid grid-cols-2 divide-x divide-white/[0.08]">
          <div className="pr-3">
            <span className="text-[11px] text-slate-400 block">
              Tiempo de espera
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <motion.span
                key={waitMinutes}
                initial={{opacity: 0.4, y: -3}}
                animate={{opacity: 1, y: 0}}
                className="font-mono-tabular text-3xl font-bold text-white leading-none"
              >
                {waitMinutes}
              </motion.span>
              <span className="text-xs font-semibold text-emerald-400">
                min
              </span>
            </div>
            {nextUnit && (
              <p className="text-[11px] text-slate-400 mt-1.5 truncate">
                {nextUnit.plate} ·{' '}
                <span className={getOccupancyText(nextUnit.occupancy).colorClass}>
                  {getOccupancyText(nextUnit.occupancy).label}
                </span>
              </p>
            )}
          </div>

          <div className="pl-3">
            <span className="text-[11px] text-slate-400 block">
              En fila aquí
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <motion.span
                key={originStop.waitingCount}
                initial={{scale: 1.12, color: '#34D399'}}
                animate={{scale: 1, color: '#FFFFFF'}}
                className="font-mono-tabular text-3xl font-bold leading-none"
              >
                {originStop.waitingCount}
              </motion.span>
              <span className="text-xs text-slate-400 font-medium">pers.</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Metro L1 ·{' '}
              <span className={`font-semibold ${metroInfo.colorClass}`}>
                {metroInfo.label}
              </span>
            </p>
          </div>
        </div>

        {/* Subtle Animated Signal Track */}
        <div className="relative h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
          <div className="route-signal-beam absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-sky-400 to-emerald-400" />
        </div>
      </div>

      {/* Primary Proof of Transit Action */}
      <AnimatePresence mode="wait">
        {!proof.pendingReport ? (
          <motion.div
            key="po-ready"
            initial={{opacity: 0, y: 6}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -6}}
            transition={{duration: 0.2, ease: EASE}}
            className="space-y-1.5"
          >
            <motion.button
              type="button"
              whileTap={proof.canCheckIn ? {scale: 0.98} : undefined}
              onClick={onCheckInClick}
              disabled={!proof.canCheckIn}
              className={`w-full min-h-[46px] px-4 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                proof.canCheckIn
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-[#131924] text-slate-500 border border-white/[0.06] cursor-not-allowed'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Estoy en la fila · +10 pts</span>
            </motion.button>

            {!isNearStop && (
              <button
                type="button"
                onClick={() => proof.simulateAtStop(originStop)}
                className="w-full min-h-[34px] rounded-lg text-[11px] font-medium text-sky-400 hover:bg-white/[0.04] flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Simular ubicación en {originStop.name}</span>
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="po-active"
            initial={{opacity: 0, y: 6}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -6}}
            transition={{duration: 0.22, ease: EASE}}
            className="surface-elevated rounded-2xl p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-300 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Validando viaje
              </span>
              <span className="font-mono-tabular font-semibold text-amber-400">
                +10 pts pendientes
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Distancia</span>
                  <span className="font-mono-tabular text-white">
                    {proof.distanceFromPendingStopM}/150m
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                  <motion.div
                    animate={{width: `${distPct}%`}}
                    transition={{type: 'spring', stiffness: 180, damping: 24}}
                    className="h-full rounded-full bg-amber-400"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Velocidad</span>
                  <span className="font-mono-tabular text-white">
                    {proof.currentSpeedKmh}/15 km/h
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                  <motion.div
                    animate={{width: `${speedPct}%`}}
                    transition={{type: 'spring', stiffness: 180, damping: 24}}
                    className="h-full rounded-full bg-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileTap={{scale: 0.97}}
                onClick={onOpenQrScanner}
                className="min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Escanear QR</span>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{scale: 0.97}}
                disabled={proof.isSimulatingBoarding}
                onClick={proof.simulateBoardingAt25Kmh}
                className="min-h-[40px] rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-white font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
              >
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>
                  {proof.isSimulatingBoarding ? 'Abordando...' : 'Simular 25 km/h'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Approaching Units: Camionetica, Metrobús & Metro L1 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400">
            Camionetica, Metrobús y Metro L1
          </h3>
          <button
            type="button"
            onClick={onOpenFareCalculator}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Pasajes Bs/$</span>
          </button>
        </div>

        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {sortedUnits.map((unit) => {
            const occ = getOccupancyText(unit.occupancy);
            const isMetrobus = unit.transportType === 'metrobus';
            const eta = estimateUnitEtaMin(unit, originStop);

            return (
              <button
                key={unit.id}
                type="button"
                onClick={() =>
                  onSelectStop({
                    ...originStop,
                    lat: unit.lat,
                    lng: unit.lng,
                  })
                }
                className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.03] px-1 -mx-1 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono-tabular text-[11px] font-bold shrink-0 ${
                      isMetrobus
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    {isMetrobus
                      ? 'MB'
                      : unit.unitCode.replace('UNIDAD-', 'U')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {isMetrobus ? 'Metrobús' : 'Camionetica'} · {unit.plate}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      <span className={occ.colorClass}>{occ.label}</span> ·{' '}
                      <span className="font-mono-tabular">
                        {unit.pagoMovil.fareBs} Bs
                      </span>{' '}
                      · {unit.driverName.split(' ')[0]}
                    </p>
                  </div>
                </div>
                <span className="font-mono-tabular text-sm font-bold text-white shrink-0">
                  {eta} min
                </span>
              </button>
            );
          })}

          <div className="py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
                <TrainFront className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  Metro Línea 1 · {originStop.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className={metroInfo.colorClass}>{metroInfo.label}</span>{' '}
                  · 15 Bs SUVE
                </p>
              </div>
            </div>
            <span className="font-mono-tabular text-sm font-bold text-white shrink-0">
              {metroInfo.eta}
            </span>
          </div>
        </div>
      </section>

      {/* Quiet Live Alert (Only the latest active road alert) */}
      {roadAlerts.length > 0 && (
        <div className="surface-elevated rounded-xl p-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white leading-snug">
              {roadAlerts[0].label}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {roadAlerts[0].stopName} · {roadAlerts[0].timeAgo}
            </p>
          </div>
        </div>
      )}

      {/* Subtle Nearby Merchant Shortcut */}
      {nearbyMerchant && (
        <button
          type="button"
          onClick={onOpenMerchantsTab}
          className="w-full p-3 rounded-xl bg-amber-400/[0.07] hover:bg-amber-400/[0.12] border border-amber-400/20 flex items-center justify-between gap-3 text-left transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Store className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {nearbyMerchant.name}
              </p>
              <p className="text-[11px] text-amber-300 truncate">
                {nearbyMerchant.offerTitle} · {nearbyMerchant.pointsCost} pts
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-300 shrink-0" />
        </button>
      )}
    </motion.div>
  );
};
