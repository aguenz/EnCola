import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {haversineDistanceMeters} from '../lib/geo';
import {supabase} from '../lib/supabase';
import type {
  ActiveUnit,
  Coordinates,
  PendingQueueReport,
  TransitStop,
} from '../types';

interface UseProofOfTransitParams {
  stops: TransitStop[];
  activeUnits: ActiveUnit[];
  isDemo: boolean;
  onPointsPendingAdded: (points: number, stopId: string) => void;
  onPointsConfirmed: (
    points: number,
    stopId: string,
    method: 'gps_velocity' | 'qr_scan',
    detail: string
  ) => void;
}

export interface ProofOfTransitState {
  userCoords: Coordinates;
  gpsMode: 'demo' | 'live';
  currentSpeedKmh: number;
  nearestStop: TransitStop;
  distanceToNearestStopM: number;
  canCheckIn: boolean;
  pendingReport: PendingQueueReport | null;
  distanceFromPendingStopM: number;
  isSimulatingBoarding: boolean;
  gpsError: string | null;
  simulateAtStop: (stop: TransitStop) => void;
  enableLiveGps: () => void;
  submitQueueCheckIn: (stop?: TransitStop) => Promise<{ok: boolean; message: string}>;
  simulateBoardingAt25Kmh: () => void;
  validateWithUnitQr: (unitCode: string) => Promise<{ok: boolean; message: string}>;
}

export function useProofOfTransit({
  stops,
  activeUnits,
  isDemo,
  onPointsPendingAdded,
  onPointsConfirmed,
}: UseProofOfTransitParams): ProofOfTransitState {
  // Default demo GPS starts ~18m from Chacaíto so jury can test immediately or teleport to any stop
  const [userCoords, setUserCoords] = useState<Coordinates>({
    lat: 10.49072,
    lng: -66.86882,
  });
  const [gpsMode, setGpsMode] = useState<'demo' | 'live'>('demo');
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [pendingReport, setPendingReport] = useState<PendingQueueReport | null>(
    null
  );
  const [isSimulatingBoarding, setIsSimulatingBoarding] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const simTimerRef = useRef<number | null>(null);
  const confirmingRef = useRef<boolean>(false);

  // Compute nearest stop using Haversine formula
  const {nearestStop, distanceToNearestStopM} = useMemo(() => {
    let bestStop = stops[0];
    let bestDist = Number.POSITIVE_INFINITY;
    for (const stop of stops) {
      const dist = haversineDistanceMeters(userCoords, {
        lat: stop.lat,
        lng: stop.lng,
      });
      if (dist < bestDist) {
        bestDist = dist;
        bestStop = stop;
      }
    }
    return {
      nearestStop: bestStop,
      distanceToNearestStopM: Math.round(bestDist),
    };
  }, [stops, userCoords]);

  const distanceFromPendingStopM = useMemo(() => {
    if (!pendingReport) return 0;
    return Math.round(
      haversineDistanceMeters(userCoords, {
        lat: pendingReport.stopLat,
        lng: pendingReport.stopLng,
      })
    );
  }, [pendingReport, userCoords]);

  const canCheckIn = distanceToNearestStopM <= 50 && !pendingReport;

  // Confirm pending points via Supabase RPC or local demo fallback
  const confirmPendingPoints = useCallback(
    async (
      report: PendingQueueReport,
      method: 'gps_velocity' | 'qr_scan',
      opts: {coords?: Coordinates; speedKmh?: number; unitCode?: string}
    ) => {
      if (confirmingRef.current) return;
      confirmingRef.current = true;

      try {
        if (!isDemo && supabase) {
          await supabase.rpc('confirm_transit_points', {
            p_report_id: report.id,
            p_validation_method: method,
            p_current_lat: opts.coords?.lat ?? null,
            p_current_lng: opts.coords?.lng ?? null,
            p_speed_kmh: opts.speedKmh ?? null,
            p_unit_code: opts.unitCode ?? null,
          });
        }

        const detail =
          method === 'gps_velocity'
            ? `Abordaje confirmado a ${Math.round(opts.speedKmh ?? 25)} km/h (>150m de ${report.stopName})`
            : `Abordaje validado por QR en ${opts.unitCode?.toUpperCase()}`;

        setPendingReport(null);
        onPointsConfirmed(report.pointsAwarded, report.stopId, method, detail);
      } finally {
        confirmingRef.current = false;
      }
    },
    [isDemo, onPointsConfirmed]
  );

  // Automatic real GPS Proof-of-Transit trigger (>150m from stop AND >15 km/h)
  useEffect(() => {
    if (!pendingReport || isSimulatingBoarding) return;
    if (distanceFromPendingStopM > 150 && currentSpeedKmh > 15) {
      void confirmPendingPoints(pendingReport, 'gps_velocity', {
        coords: userCoords,
        speedKmh: currentSpeedKmh,
      });
    }
  }, [
    pendingReport,
    isSimulatingBoarding,
    distanceFromPendingStopM,
    currentSpeedKmh,
    userCoords,
    confirmPendingPoints,
  ]);

  // Cleanup geolocation watch & simulation timers
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simTimerRef.current !== null) {
        window.clearInterval(simTimerRef.current);
      }
    };
  }, []);

  const simulateAtStop = useCallback((stop: TransitStop) => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsMode('demo');
    setGpsError(null);
    setCurrentSpeedKmh(0);
    // Place user ~12 meters from the stop center
    setUserCoords({
      lat: stop.lat + 0.00009,
      lng: stop.lng + 0.00007,
    });
  }, []);

  const enableLiveGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Tu navegador no soporta GPS en vivo. Usando GPS Demo.');
      return;
    }
    setGpsMode('live');
    setGpsError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        const speedMps = pos.coords.speed ?? 0;
        setCurrentSpeedKmh(Math.max(0, Math.round(speedMps * 3.6)));
      },
      () => {
        setGpsError('Permiso GPS no otorgado. Continuando en GPS Demo.');
        setGpsMode('demo');
      },
      {enableHighAccuracy: true, maximumAge: 3000, timeout: 10000}
    );
  }, []);

  const submitQueueCheckIn = useCallback(
    async (explicitStop?: TransitStop): Promise<{ok: boolean; message: string}> => {
      const targetStop = explicitStop ?? nearestStop;
      const dist = Math.round(
        haversineDistanceMeters(userCoords, {
          lat: targetStop.lat,
          lng: targetStop.lng,
        })
      );

      if (dist > 50) {
        return {
          ok: false,
          message: `Estás a ${dist}m de ${targetStop.name}. Acércate a menos de 50m o simula tu ubicación.`,
        };
      }

      if (pendingReport) {
        return {
          ok: false,
          message: 'Ya tienes un check-in pendiente. Aborda una unidad para desbloquear tus puntos.',
        };
      }

      let reportId = `rpt-${Date.now()}`;

      if (!isDemo && supabase) {
        const {data, error} = await supabase.rpc('report_queue_checkin', {
          p_stop_id: targetStop.id,
          p_lat: userCoords.lat,
          p_lng: userCoords.lng,
        });
        if (error) {
          return {ok: false, message: error.message};
        }
        if (data && typeof data === 'object' && 'report_id' in data) {
          reportId = String((data as {report_id: string}).report_id);
        }
      }

      const newReport: PendingQueueReport = {
        id: reportId,
        stopId: targetStop.id,
        stopName: targetStop.name,
        stopLat: targetStop.lat,
        stopLng: targetStop.lng,
        pointsAwarded: 10,
        reportedAt: Date.now(),
        status: 'pending',
      };

      setPendingReport(newReport);
      onPointsPendingAdded(10, targetStop.id);

      return {
        ok: true,
        message: `+10 pts pendientes en ${targetStop.name}. Aborda o escanea el QR para confirmarlos.`,
      };
    },
    [nearestStop, userCoords, pendingReport, isDemo, onPointsPendingAdded]
  );

  const simulateBoardingAt25Kmh = useCallback(() => {
    if (!pendingReport || isSimulatingBoarding) return;

    setIsSimulatingBoarding(true);
    setGpsMode('demo');
    const reportSnapshot = pendingReport;
    const startLat = reportSnapshot.stopLat;
    const startLng = reportSnapshot.stopLng;
    let step = 0;
    const totalSteps = 8;

    if (simTimerRef.current !== null) {
      window.clearInterval(simTimerRef.current);
    }

    simTimerRef.current = window.setInterval(() => {
      step += 1;
      // Move east along Av. Francisco de Miranda (~220m total)
      const progress = step / totalSteps;
      const nextCoords: Coordinates = {
        lat: startLat + progress * 0.00045,
        lng: startLng + progress * 0.00205,
      };
      const simulatedSpeed = Math.round(14 + progress * 11); // Ramps to 25 km/h

      setUserCoords(nextCoords);
      setCurrentSpeedKmh(simulatedSpeed);

      if (step >= totalSteps) {
        if (simTimerRef.current !== null) {
          window.clearInterval(simTimerRef.current);
          simTimerRef.current = null;
        }
        setIsSimulatingBoarding(false);
        void confirmPendingPoints(reportSnapshot, 'gps_velocity', {
          coords: nextCoords,
          speedKmh: 25,
        });
      }
    }, 190);
  }, [pendingReport, isSimulatingBoarding, confirmPendingPoints]);

  const validateWithUnitQr = useCallback(
    async (unitCode: string): Promise<{ok: boolean; message: string}> => {
      const normalized = unitCode.trim().toUpperCase();
      if (!pendingReport) {
        return {
          ok: false,
          message: 'Primero reporta "Estoy en la fila (+10 pts)" en tu parada antes de validar el QR.',
        };
      }

      const matchedUnit = activeUnits.find(
        (u) => u.unitCode.toUpperCase() === normalized && u.isActive
      );

      if (!matchedUnit) {
        return {
          ok: false,
          message: `Código "${normalized}" no encontrado entre las unidades activas (prueba UNIDAD-01).`,
        };
      }

      await confirmPendingPoints(pendingReport, 'qr_scan', {
        unitCode: matchedUnit.unitCode,
      });

      return {
        ok: true,
        message: `¡QR de ${matchedUnit.unitCode} verificado! +10 pts confirmados.`,
      };
    },
    [pendingReport, activeUnits, confirmPendingPoints]
  );

  return {
    userCoords,
    gpsMode,
    currentSpeedKmh,
    nearestStop,
    distanceToNearestStopM,
    canCheckIn,
    pendingReport,
    distanceFromPendingStopM,
    isSimulatingBoarding,
    gpsError,
    simulateAtStop,
    enableLiveGps,
    submitQueueCheckIn,
    simulateBoardingAt25Kmh,
    validateWithUnitQr,
  };
}
