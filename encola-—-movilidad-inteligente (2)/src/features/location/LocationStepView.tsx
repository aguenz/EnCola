import React from 'react';
import {motion} from 'motion/react';
import {ArrowRight, Bus, MapPin, Navigation} from 'lucide-react';
import type {ActiveUnit, TransitStop, UserRole} from '../../types';

interface LocationStepViewProps {
  role: UserRole;
  stops: TransitStop[];
  currentStop: TransitStop;
  destinationStop: TransitStop;
  distanceToStopM: number;
  gpsMode: 'demo' | 'live';
  driverUnit: ActiveUnit;
  driverDirection: 1 | -1;
  onSelectCurrentStop: (stop: TransitStop) => void;
  onSelectDestinationStop: (stop: TransitStop) => void;
  onToggleDriverDirection: (dir: 1 | -1) => void;
  onEnableLiveGps: () => void;
  onConfirmAndContinue: () => void;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const LocationStepView: React.FC<LocationStepViewProps> = ({
  role,
  stops,
  currentStop,
  destinationStop,
  distanceToStopM,
  gpsMode,
  driverUnit,
  driverDirection,
  onSelectCurrentStop,
  onSelectDestinationStop,
  onToggleDriverDirection,
  onEnableLiveGps,
  onConfirmAndContinue,
}) => {
  const isDriver = role === 'driver';

  const currentIdx = stops.findIndex((s) => s.id === currentStop.id);
  const nextStopIdx =
    driverDirection === 1
      ? Math.min(stops.length - 1, currentIdx + 1)
      : Math.max(0, currentIdx - 1);
  const nextDriverStop = stops[nextStopIdx] ?? stops[0];

  const destinationOptions = stops.filter((s) => s.id !== currentStop.id);

  return (
    <motion.div
      initial={{opacity: 0, y: 12}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -8}}
      transition={{duration: 0.28, ease: EASE}}
      className="h-full flex flex-col bg-[#0C1017]"
    >
      {/* Scrollable Clean Workspace */}
      <div className="sheet-scroll flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
        {/* Quiet Step Indicator & GPS Trigger */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-6 rounded-full bg-emerald-400" />
            <span className="h-1 w-6 rounded-full bg-emerald-400" />
            <span className="h-1 w-6 rounded-full bg-white/15" />
            <span className="text-[11px] text-slate-400 ml-1.5">
              Ubicación
            </span>
          </div>

          <button
            type="button"
            onClick={onEnableLiveGps}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{gpsMode === 'live' ? 'GPS activo' : 'Usar GPS'}</span>
          </button>
        </div>

        {/* Clean Focal Spotlight: Where You Are */}
        <motion.div
          key={currentStop.id}
          initial={{opacity: 0, y: 6}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.22, ease: EASE}}
          className="surface-elevated rounded-2xl p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <span
                className={`radar-ping-ring absolute inset-0 rounded-2xl border ${
                  isDriver
                    ? 'border-sky-400/60 bg-sky-500/10'
                    : 'border-emerald-400/60 bg-emerald-500/10'
                }`}
              />
              <span
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center ${
                  isDriver
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-emerald-500 text-slate-950'
                }`}
              >
                {isDriver ? (
                  <Bus className="w-5 h-5 stroke-[2.2]" />
                ) : (
                  <MapPin className="w-5 h-5 stroke-[2.2]" />
                )}
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-xs text-slate-400 block">
                {isDriver
                  ? `${driverUnit.unitCode} ubicada en`
                  : 'Parada actual detectada'}
              </span>
              <h1 className="font-display text-xl font-bold text-white leading-tight truncate mt-0.5">
                {currentStop.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono-tabular">
                {currentStop.waitingCount} personas en fila · a {distanceToStopM}{' '}
                m
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stop Selector (Clean Horizontal Scroll Strip — Zero Wall of Buttons) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              {isDriver ? '¿Estás en otra parada?' : 'Cambiar parada de origen'}
            </label>
            <span className="text-[11px] text-slate-500">
              o toca en el mapa
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {stops.map((stop) => {
              const isSelected = stop.id === currentStop.id;
              return (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => onSelectCurrentStop(stop)}
                  className={`relative min-h-[42px] px-3.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 ${
                    isSelected
                      ? 'text-slate-950 font-bold'
                      : 'bg-[#131924] hover:bg-[#1A2232] text-slate-300 border border-white/[0.06] font-medium'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="originStopPill"
                      transition={{type: 'spring', stiffness: 440, damping: 34}}
                      className="absolute inset-0 rounded-xl bg-white"
                    />
                  )}
                  <span className="relative z-10">{stop.name}</span>
                  <span
                    className={`relative z-10 font-mono-tabular text-[11px] ${
                      isSelected ? 'text-slate-600' : 'text-slate-500'
                    }`}
                  >
                    {stop.waitingCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Role-Specific Next Choice */}
        {!isDriver ? (
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 block">
              ¿Hacia dónde vas?
            </label>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {destinationOptions.map((stop) => {
                const isDest = stop.id === destinationStop.id;
                return (
                  <button
                    key={stop.id}
                    type="button"
                    onClick={() => onSelectDestinationStop(stop)}
                    className={`relative min-h-[42px] px-3.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-colors ${
                      isDest
                        ? 'text-slate-950 font-bold'
                        : 'bg-[#131924] hover:bg-[#1A2232] text-slate-300 border border-white/[0.06] font-medium'
                    }`}
                  >
                    {isDest && (
                      <motion.span
                        layoutId="destStopPill"
                        transition={{
                          type: 'spring',
                          stiffness: 440,
                          damping: 34,
                        }}
                        className="absolute inset-0 rounded-xl bg-sky-400"
                      />
                    )}
                    <span className="relative z-10">{stop.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Sentido del recorrido
            </label>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#131924] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => onToggleDriverDirection(1)}
                className={`relative min-h-[42px] rounded-lg text-xs font-semibold transition-colors ${
                  driverDirection === 1
                    ? 'text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {driverDirection === 1 && (
                  <motion.span
                    layoutId="driverDirThumb"
                    transition={{type: 'spring', stiffness: 440, damping: 34}}
                    className="absolute inset-0 rounded-lg bg-sky-400"
                  />
                )}
                <span className="relative z-10">Hacia Petare →</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleDriverDirection(-1)}
                className={`relative min-h-[42px] rounded-lg text-xs font-semibold transition-colors ${
                  driverDirection === -1
                    ? 'text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {driverDirection === -1 && (
                  <motion.span
                    layoutId="driverDirThumb"
                    transition={{type: 'spring', stiffness: 440, damping: 34}}
                    className="absolute inset-0 rounded-lg bg-sky-400"
                  />
                )}
                <span className="relative z-10">← Hacia Plz. Vzla</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Próxima parada:{' '}
              <span className="text-white font-semibold">
                {nextDriverStop.name}
              </span>{' '}
              ·{' '}
              <span className="font-mono-tabular text-amber-300 font-semibold">
                {nextDriverStop.waitingCount} esperando
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Clean Docked Primary CTA */}
      <div className="px-5 sm:px-6 py-4 border-t border-white/[0.06] bg-[#0C1017] shrink-0">
        <motion.button
          type="button"
          whileTap={{scale: 0.98}}
          onClick={onConfirmAndContinue}
          className={`group w-full min-h-[52px] px-5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            isDriver
              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
          }`}
        >
          <span>
            {isDriver
              ? 'Ver trayecto y pasajeros'
              : 'Ver trayecto y tiempo de espera'}
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
        </motion.button>
      </div>
    </motion.div>
  );
};
