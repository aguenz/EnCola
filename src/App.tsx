import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {APIProvider} from '@vis.gl/react-google-maps';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  LogOut,
  MapPin,
  Navigation,
  QrCode,
  Radio,
  ShoppingBag,
  User,
  Users,
} from 'lucide-react';
import {CaracasTransitMap} from './components/map/CaracasTransitMap';
import {AnimatedTransitBackground} from './components/ui/AnimatedTransitBackground';
import {EnColaLogo} from './components/ui/EnColaLogo';
import {OfflineIndicator} from './components/ui/OfflineIndicator';
import {SplashIntro} from './components/ui/SplashIntro';
import {AuthScreen} from './features/auth/AuthScreen';
import {DriverControlsSheet} from './features/driver/DriverControlsSheet';
import {DriverQrModal} from './features/driver/DriverQrModal';
import {AnimatedTicketModal} from './features/merchants/AnimatedTicketModal';
import {MerchantsSheet} from './features/merchants/MerchantsSheet';
import {FareCalculatorModal} from './features/passenger/FareCalculatorModal';
import {
  estimateUnitEtaMin,
  PassengerRouteSheet,
} from './features/passenger/PassengerRouteSheet';
import {UnitQrScannerModal} from './features/passenger/UnitQrScannerModal';
import {ProfileSheet} from './features/profile/ProfileSheet';
import {useProofOfTransit} from './hooks/useProofOfTransit';
import {
  AV_FRANCISCO_DE_MIRANDA_ROUTE,
  INITIAL_MERCHANTS,
  INITIAL_ROAD_ALERTS,
  INITIAL_STOPS,
  INITIAL_UNITS,
} from './lib/caracasData';
import {generateVoucherCode, interpolateAlongRoute} from './lib/geo';
import {supabase} from './lib/supabase';
import type {
  ActiveUnit,
  Merchant,
  OccupancyStatus,
  PassengerTab,
  RedemptionTicket,
  RoadAlert,
  RoadAlertType,
  TransitNotification,
  TransitStop,
  UserProfile,
  UserRole,
} from './types';

const ROUTE_MAX_INDEX = AV_FRANCISCO_DE_MIRANDA_ROUTE.length - 1;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const CAMILA_AVATAR_URL =
  '/src/assets/images/avatar_camila_pasajero_1795725030121.jpg';
const ROBERTO_AVATAR_URL =
  '/src/assets/images/avatar_roberto_conductor_1795725029462.jpg';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';

function getCompactOccupancyMeta(occ: ActiveUnit['occupancy']) {
  if (occ === 'libre') {
    return {label: 'Asientos libres', colorClass: 'text-emerald-400'};
  }
  if (occ === 'de_pie') {
    return {label: 'De pie', colorClass: 'text-amber-400'};
  }
  return {label: 'Full', colorClass: 'text-red-400'};
}

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<PassengerTab>('route');
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false);
  const [isStopMenuOpen, setIsStopMenuOpen] = useState<boolean>(false);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState<boolean>(false);

  // Listen for Google Maps Platform quota exhaustion events (Demo Key defense)
  useEffect(() => {
    const handleQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Core Caracas real-time transit state
  const [stops, setStops] = useState<TransitStop[]>(INITIAL_STOPS);
  const [units, setUnits] = useState<ActiveUnit[]>(INITIAL_UNITS);
  const [merchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [roadAlerts, setRoadAlerts] =
    useState<RoadAlert[]>(INITIAL_ROAD_ALERTS);
  const [shiftValidatedPassengers, setShiftValidatedPassengers] =
    useState<number>(28);

  // Journey Selection State
  const [originStopId, setOriginStopId] = useState<string>(INITIAL_STOPS[1].id);
  const [destinationStopId, setDestinationStopId] = useState<string>(
    INITIAL_STOPS[5].id
  );
  const [driverDirection, setDriverDirection] = useState<1 | -1>(1);

  const [focusTarget, setFocusTarget] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    ts: number;
  } | null>(null);

  // Modals & Tickets
  const [isFareCalcOpen, setIsFareCalcOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isDriverQrOpen, setIsDriverQrOpen] = useState(false);
  const [redemptions, setRedemptions] = useState<RedemptionTicket[]>([]);
  const [openTicket, setOpenTicket] = useState<RedemptionTicket | null>(null);
  const [toast, setToast] = useState<TransitNotification | null>(null);

  const showToast = useCallback(
    (tone: TransitNotification['tone'], title: string, message: string) => {
      const id = `toast-${Date.now()}`;
      setToast({id, tone, title, message});
      window.setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 3600);
    },
    []
  );

  // Optional Supabase OAuth Session Hydration
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let mounted = true;

    const loadSession = async () => {
      const {data} = await client.auth.getSession();
      const user = data.session?.user;
      if (!user || !mounted) return;

      const {data: dbProfile} = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;
      const name =
        dbProfile?.full_name ||
        (user.user_metadata?.full_name as string | undefined) ||
        'Viajero Caracas';

      setProfile({
        id: user.id,
        email: user.email ?? 'usuario@encola.ve',
        fullName: name,
        avatarInitials: name
          .split(' ')
          .slice(0, 2)
          .map((w: string) => w[0]?.toUpperCase() ?? '')
          .join(''),
        role: dbProfile?.role === 'driver' ? 'driver' : 'passenger',
        unitCode: dbProfile?.unit_code ?? null,
        confirmedPoints: dbProfile?.confirmed_points ?? 0,
        pendingPoints: dbProfile?.pending_points ?? 0,
        isDemo: false,
      });
      setActiveTab('route');
      setSheetExpanded(false);
    };

    void loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  // Fluid Real-Time Simulation of Camionetas & Metrobús along Av. Francisco de Miranda
  useEffect(() => {
    if (!profile) return;

    const timer = window.setInterval(() => {
      setUnits((prevUnits) =>
        prevUnits.map((unit) => {
          if (!unit.isActive) return unit;

          const step = unit.transportType === 'metrobus' ? 0.01 : 0.013;
          let nextProgress = unit.routeProgress + step * unit.direction;
          let nextDirection = unit.direction;

          if (nextProgress >= 1) {
            nextProgress = 1;
            nextDirection = -1;
          } else if (nextProgress <= 0) {
            nextProgress = 0;
            nextDirection = 1;
          }

          const coords = interpolateAlongRoute(
            AV_FRANCISCO_DE_MIRANDA_ROUTE,
            nextProgress
          );
          const jitterSpeed =
            unit.transportType === 'metrobus'
              ? 22 + Math.round(Math.sin(nextProgress * 12) * 4)
              : 24 + Math.round(Math.cos(nextProgress * 10) * 6);

          return {
            ...unit,
            lat: coords.lat,
            lng: coords.lng,
            direction: nextDirection,
            routeProgress: nextProgress,
            speedKmh: Math.max(14, jitterSpeed),
          };
        })
      );
    }, 1200);

    return () => window.clearInterval(timer);
  }, [profile]);

  // Proof of Transit callbacks
  const handlePointsPendingAdded = useCallback(
    (points: number, stopId: string) => {
      setProfile((prev) =>
        prev ? {...prev, pendingPoints: prev.pendingPoints + points} : prev
      );
      setStops((prev) =>
        prev.map((s) =>
          s.id === stopId ? {...s, waitingCount: s.waitingCount + 1} : s
        )
      );
    },
    []
  );

  const handlePointsConfirmed = useCallback(
    (
      points: number,
      stopId: string,
      _method: 'gps_velocity' | 'qr_scan',
      detail: string
    ) => {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              confirmedPoints: prev.confirmedPoints + points,
              pendingPoints: Math.max(0, prev.pendingPoints - points),
            }
          : prev
      );
      setStops((prev) =>
        prev.map((s) =>
          s.id === stopId
            ? {...s, waitingCount: Math.max(0, s.waitingCount - 1)}
            : s
        )
      );
      showToast('emerald', `+${points} pts confirmados`, detail);
    },
    [showToast]
  );

  const proof = useProofOfTransit({
    stops,
    activeUnits: units,
    isDemo: profile?.isDemo ?? true,
    onPointsPendingAdded: handlePointsPendingAdded,
    onPointsConfirmed: handlePointsConfirmed,
  });

  // Resolve origin, destination & driver next stop
  const originStop = useMemo(
    () => stops.find((s) => s.id === originStopId) ?? stops[1],
    [stops, originStopId]
  );

  const destinationStop = useMemo(() => {
    const found = stops.find((s) => s.id === destinationStopId);
    if (found && found.id !== originStop.id) return found;
    return stops.find((s) => s.id !== originStop.id) ?? stops[stops.length - 1];
  }, [stops, destinationStopId, originStop.id]);

  const driverNextStop = useMemo(() => {
    const idx = stops.findIndex((s) => s.id === originStop.id);
    if (driverDirection === 1) {
      return (
        stops[Math.min(stops.length - 1, idx + 1)] ?? stops[stops.length - 1]
      );
    }
    return stops[Math.max(0, idx - 1)] ?? stops[0];
  }, [stops, originStop.id, driverDirection]);

  // Closest active unit to originStop (for compact Bottom Sheet)
  const closestUnit = useMemo(() => {
    const active = units.filter((u) => u.isActive);
    if (active.length === 0) return null;
    return [...active].sort(
      (a, b) =>
        estimateUnitEtaMin(a, originStop) - estimateUnitEtaMin(b, originStop)
    )[0];
  }, [units, originStop]);

  // Highlighted route segment on Google Maps
  const highlightedSegment = useMemo<[number, number][] | undefined>(() => {
    if (!profile) return undefined;
    const targetEndStop =
      profile.role === 'driver' ? driverNextStop : destinationStop;
    const startIdx = Math.min(originStop.routeIndex, targetEndStop.routeIndex);
    const endIdx = Math.max(originStop.routeIndex, targetEndStop.routeIndex);
    if (startIdx === endIdx) return undefined;
    return AV_FRANCISCO_DE_MIRANDA_ROUTE.slice(startIdx, endIdx + 1);
  }, [profile, originStop, destinationStop, driverNextStop]);

  // 1-Tap Auth Handlers -> Enter Live Full-Height Map Immediately
  const handleStartDemoPassenger = () => {
    setProfile({
      id: 'demo-passenger-ccs',
      email: 'pasajero.demo@encola.ve',
      fullName: 'Camila Mendoza',
      avatarInitials: 'CM',
      avatarUrl: CAMILA_AVATAR_URL,
      role: 'passenger',
      unitCode: null,
      confirmedPoints: 45,
      pendingPoints: 0,
      isDemo: true,
    });
    const startStop = stops[1];
    setOriginStopId(startStop.id);
    setDestinationStopId(stops[5].id);
    proof.simulateAtStop(startStop);
    setActiveTab('route');
    setSheetExpanded(false);
    setIsStopMenuOpen(false);
    setFocusTarget({
      lat: startStop.lat,
      lng: startStop.lng,
      zoom: 15,
      ts: Date.now(),
    });
  };

  const handleStartDemoDriver = () => {
    setProfile({
      id: 'demo-driver-ccs',
      email: 'roberto.herrera@encola.ve',
      fullName: 'Roberto Herrera',
      avatarInitials: 'RH',
      avatarUrl: ROBERTO_AVATAR_URL,
      role: 'driver',
      unitCode: 'UNIDAD-01',
      confirmedPoints: 45,
      pendingPoints: 0,
      isDemo: true,
    });
    const startStop = stops[1];
    setOriginStopId(startStop.id);
    setDriverDirection(1);
    setUnits((prev) =>
      prev.map((u) => ({
        ...u,
        isUserDriverUnit: u.unitCode === 'UNIDAD-01',
      }))
    );
    setActiveTab('route');
    setSheetExpanded(false);
    setIsStopMenuOpen(false);
    setFocusTarget({
      lat: startStop.lat,
      lng: startStop.lng,
      zoom: 15,
      ts: Date.now(),
    });
  };

  const handleDirectLogin = ({
    role,
    identifier,
    fullName,
  }: {
    role: UserRole;
    identifier: string;
    fullName?: string;
  }) => {
    const resolvedName =
      fullName || (role === 'driver' ? 'Roberto Herrera' : 'Camila Mendoza');
    const initials = resolvedName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
    const startStop = stops[1];
    setProfile({
      id: `direct-${Date.now()}`,
      email: identifier,
      fullName: resolvedName,
      avatarInitials: initials || 'RC',
      avatarUrl: role === 'driver' ? ROBERTO_AVATAR_URL : CAMILA_AVATAR_URL,
      role,
      unitCode: role === 'driver' ? 'UNIDAD-01' : null,
      confirmedPoints: 45,
      pendingPoints: 0,
      isDemo: true,
    });
    setOriginStopId(startStop.id);
    if (role === 'passenger') {
      setDestinationStopId(stops[5].id);
      proof.simulateAtStop(startStop);
    } else {
      setDriverDirection(1);
      setUnits((prev) =>
        prev.map((u) => ({
          ...u,
          isUserDriverUnit: u.unitCode === 'UNIDAD-01',
        }))
      );
    }
    setActiveTab('route');
    setSheetExpanded(false);
    setIsStopMenuOpen(false);
    setFocusTarget({
      lat: startStop.lat,
      lng: startStop.lng,
      zoom: 15,
      ts: Date.now(),
    });
  };

  // Instant Role Switching from Top Bar or Profile
  const handleSwitchToDriver = (unitCode: string) => {
    const normalized = unitCode.trim().toUpperCase() || 'UNIDAD-01';
    setUnits((prev) => {
      const exists = prev.some((u) => u.unitCode.toUpperCase() === normalized);
      if (exists) {
        return prev.map((u) => ({
          ...u,
          isUserDriverUnit: u.unitCode.toUpperCase() === normalized,
        }));
      }
      const newUnit: ActiveUnit = {
        id: `unit-${Date.now()}`,
        unitCode: normalized,
        plate: 'VE-204-CCS',
        driverName: profile?.fullName ?? 'Conductor EnCola',
        routeName: 'Corredor Miranda · Plz. Vzla ↔ Petare',
        transportType: 'camioneta',
        lat: originStop.lat,
        lng: originStop.lng,
        speedKmh: 24,
        occupancy: 'libre',
        isActive: true,
        direction: driverDirection,
        routeProgress: originStop.routeIndex / ROUTE_MAX_INDEX,
        isUserDriverUnit: true,
        pagoMovil: {
          bank: 'Banesco (0134)',
          phone: '0412-555-0194',
          idNumber: 'V-19.482.310',
          fareBs: 25,
        },
      };
      return [
        ...prev.map((u) => ({...u, isUserDriverUnit: false})),
        newUnit,
      ];
    });

    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        role: 'driver',
        unitCode: normalized,
        ...(prev.isDemo
          ? {
              fullName: 'Roberto Herrera',
              avatarInitials: 'RH',
              avatarUrl: ROBERTO_AVATAR_URL,
              email: 'roberto.herrera@encola.ve',
            }
          : {}),
      };
    });
    setActiveTab((prev) => (prev === 'merchants' ? 'route' : prev));
    setIsStopMenuOpen(false);
    setFocusTarget({
      lat: originStop.lat,
      lng: originStop.lng,
      zoom: 15,
      ts: Date.now(),
    });
  };

  const handleSwitchToPassenger = () => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        role: 'passenger',
        ...(prev.isDemo
          ? {
              fullName: 'Camila Mendoza',
              avatarInitials: 'CM',
              avatarUrl: CAMILA_AVATAR_URL,
              email: 'pasajero.demo@encola.ve',
            }
          : {}),
      };
    });
    setIsStopMenuOpen(false);
    setFocusTarget({
      lat: originStop.lat,
      lng: originStop.lng,
      zoom: 15,
      ts: Date.now(),
    });
  };

  // Driver Unit & Controls
  const driverUnit = useMemo(() => {
    const code = profile?.unitCode ?? 'UNIDAD-01';
    return (
      units.find((u) => u.isUserDriverUnit) ??
      units.find((u) => u.unitCode.toUpperCase() === code.toUpperCase()) ??
      units[0]
    );
  }, [units, profile?.unitCode]);

  const handleSelectCurrentStop = (stop: TransitStop) => {
    setOriginStopId(stop.id);
    setIsStopMenuOpen(false);
    proof.simulateAtStop(stop);
    setFocusTarget({lat: stop.lat, lng: stop.lng, zoom: 15, ts: Date.now()});
    if (profile?.role === 'driver') {
      setUnits((prev) =>
        prev.map((u) =>
          u.id === driverUnit.id
            ? {
                ...u,
                lat: stop.lat,
                lng: stop.lng,
                routeProgress: stop.routeIndex / ROUTE_MAX_INDEX,
              }
            : u
        )
      );
    }
  };

  const handleAdvanceDriverStop = () => {
    const next = driverNextStop;
    const nextIdx = stops.findIndex((s) => s.id === next.id);
    let nextDir = driverDirection;
    if (nextIdx >= stops.length - 1) nextDir = -1;
    if (nextIdx <= 0) nextDir = 1;

    const boarded = Math.min(next.waitingCount, 5);
    setShiftValidatedPassengers((prev) => prev + boarded);
    setStops((prev) =>
      prev.map((s) =>
        s.id === next.id
          ? {...s, waitingCount: Math.max(2, s.waitingCount - boarded)}
          : s
      )
    );

    setOriginStopId(next.id);
    setDriverDirection(nextDir);
    setUnits((prev) =>
      prev.map((u) =>
        u.id === driverUnit.id
          ? {
              ...u,
              lat: next.lat,
              lng: next.lng,
              direction: nextDir,
              routeProgress: next.routeIndex / ROUTE_MAX_INDEX,
            }
          : u
      )
    );
    setFocusTarget({lat: next.lat, lng: next.lng, zoom: 15, ts: Date.now()});
    showToast(
      'blue',
      `Llegaste a ${next.name}`,
      `Subieron +${boarded} pasajeros · quedan ${Math.max(2, next.waitingCount - boarded)} en fila.`
    );
  };

  const handleReportRoadAlert = (type: RoadAlertType, label: string) => {
    const newAlert: RoadAlert = {
      id: `alert-${Date.now()}`,
      type,
      label,
      stopName: originStop.name,
      timeAgo: 'Ahora',
      reporter: driverUnit.plate,
    };
    setRoadAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
    showToast('amber', `Alerta en ${originStop.name}`, label);
  };

  const handleToggleDriverRoute = () => {
    const nextActive = !driverUnit.isActive;
    setUnits((prev) =>
      prev.map((u) =>
        u.id === driverUnit.id
          ? {
              ...u,
              isActive: nextActive,
              speedKmh: nextActive ? 25 : 0,
              isUserDriverUnit: true,
            }
          : u
      )
    );
    showToast(
      nextActive ? 'emerald' : 'amber',
      nextActive ? 'Ruta iniciada' : 'Ruta finalizada',
      nextActive
        ? `${driverUnit.unitCode} visible en tiempo real.`
        : 'Transmisión GPS pausada.'
    );
  };

  const handleChangeDriverOccupancy = (occupancy: OccupancyStatus) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === driverUnit.id ? {...u, occupancy, isUserDriverUnit: true} : u
      )
    );
  };

  // Merchant Redemption Action
  const handleRedeemMerchant = async (merchant: Merchant) => {
    if (!profile) return;
    if (profile.confirmedPoints < merchant.pointsCost) {
      showToast(
        'amber',
        'Puntos insuficientes',
        `Necesitas ${merchant.pointsCost} pts confirmados.`
      );
      return;
    }

    let code = generateVoucherCode();
    let expiresAt = Date.now() + 3 * 60 * 1000;

    if (!profile.isDemo && supabase) {
      const {data, error} = await supabase.rpc('redeem_merchant_offer', {
        p_merchant_id: merchant.id,
      });
      if (error) {
        showToast('red', 'No se pudo canjear', error.message);
        return;
      }
      if (data && typeof data === 'object') {
        const payload = data as {code?: string; expires_at?: string};
        if (payload.code) code = payload.code;
        if (payload.expires_at)
          expiresAt = new Date(payload.expires_at).getTime();
      }
    }

    const newTicket: RedemptionTicket = {
      id: `tkt-${Date.now()}`,
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantEmoji: merchant.emoji,
      referenceStop: merchant.referenceStop,
      offerTitle: merchant.offerTitle,
      code,
      pointsSpent: merchant.pointsCost,
      createdAt: Date.now(),
      expiresAt,
    };

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            confirmedPoints: Math.max(
              0,
              prev.confirmedPoints - merchant.pointsCost
            ),
          }
        : prev
    );
    setRedemptions((prev) => [newTicket, ...prev]);
    setOpenTicket(newTicket);
  };

  const handleCheckInClick = async () => {
    const res = await proof.submitQueueCheckIn(originStop);
    showToast(
      res.ok ? 'amber' : 'red',
      res.ok ? '+10 pts pendientes' : 'Acércate a la parada',
      res.message
    );
  };

  const handleSignOut = async () => {
    if (supabase && !profile?.isDemo) {
      await supabase.auth.signOut();
    }
    setProfile(null);
    setActiveTab('route');
    setSheetExpanded(false);
    setIsStopMenuOpen(false);
    setOpenTicket(null);
    setRedemptions([]);
  };

  const quotaBanner = mapsQuotaExceeded ? (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs text-center sticky top-0 z-[1300]">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
    </div>
  ) : null;

  const splashOverlay = (
    <AnimatePresence>
      {showSplash && (
        <SplashIntro
          key="encola-splash"
          onComplete={() => setShowSplash(false)}
        />
      )}
    </AnimatePresence>
  );

  // LOGIN SCREEN (1-tap Demo Pasajero / Demo Conductor or Phone/Email login)
  if (!profile) {
    return (
      <APIProvider
        apiKey={GOOGLE_MAPS_API_KEY}
        language="es"
        region="VE"
        libraries={['marker', 'maps']}
      >
        {splashOverlay}
        {quotaBanner}
        <OfflineIndicator />
        <AuthScreen
          onDemoPassenger={handleStartDemoPassenger}
          onDemoDriver={handleStartDemoDriver}
          onDirectLogin={handleDirectLogin}
        />
      </APIProvider>
    );
  }

  const isDriver = profile.role === 'driver';
  const latestActiveTicket =
    redemptions.find((t) => t.expiresAt > Date.now()) ?? null;

  const closestEta = closestUnit
    ? estimateUnitEtaMin(closestUnit, originStop)
    : 5;
  const closestOcc = closestUnit
    ? getCompactOccupancyMeta(closestUnit.occupancy)
    : null;

  const driverCapacity = driverUnit.transportType === 'metrobus' ? 40 : 24;
  const driverOnboard =
    driverUnit.occupancy === 'libre'
      ? 11
      : driverUnit.occupancy === 'de_pie'
        ? 21
        : driverCapacity;

  const orderedDriverStops =
    driverDirection === 1 ? stops : [...stops].reverse();
  const curDriverStopIdx = orderedDriverStops.findIndex(
    (s) => s.id === originStop.id
  );
  const nextThreeDriverStops = orderedDriverStops.slice(
    curDriverStopIdx + 1,
    curDriverStopIdx + 4
  );
  const driverUpcoming3Demand =
    nextThreeDriverStops.length > 0
      ? nextThreeDriverStops.reduce((sum, st) => sum + st.waitingCount, 0)
      : driverNextStop.waitingCount;

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      language="es"
      region="VE"
      libraries={['marker', 'maps']}
    >
      <div className="h-screen w-screen flex flex-col bg-[#0C1017] text-slate-100 overflow-hidden">
        {splashOverlay}
        {quotaBanner}
        <OfflineIndicator />

        {/* TOP BAR: Official EnCola Logo + Pasajero/Conductor Toggle + Points/Status */}
        <header className="h-14 px-3 sm:px-5 bg-[#0C1017] border-b border-white/[0.06] flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-50">
          <div className="flex items-center gap-2 shrink-0">
            <EnColaLogo size={30} />
            <span className="font-display text-base font-extrabold tracking-tight text-white whitespace-nowrap hidden sm:inline">
              En<span className="text-emerald-400">Cola</span>
            </span>
          </div>

          {/* Clean Pasajero / Conductor Segmented Switch */}
          <div
            role="group"
            aria-label="Cambiar rol"
            className="grid grid-cols-2 p-0.5 rounded-xl bg-[#131924] border border-white/[0.07] shrink-0"
          >
            <button
              type="button"
              onClick={() => {
                if (isDriver) handleSwitchToPassenger();
              }}
              className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                !isDriver
                  ? 'text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {!isDriver && (
                <motion.span
                  layoutId="headerRoleThumb"
                  transition={{type: 'spring', stiffness: 460, damping: 34}}
                  className="absolute inset-0 rounded-lg bg-emerald-400"
                />
              )}
              <Users className="relative z-10 w-3.5 h-3.5 hidden sm:inline-block" />
              <span className="relative z-10">Pasajero</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isDriver) {
                  handleSwitchToDriver(profile.unitCode ?? 'UNIDAD-01');
                }
              }}
              className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isDriver
                  ? 'text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isDriver && (
                <motion.span
                  layoutId="headerRoleThumb"
                  transition={{type: 'spring', stiffness: 460, damping: 34}}
                  className="absolute inset-0 rounded-lg bg-amber-400"
                />
              )}
              <Bus className="relative z-10 w-3.5 h-3.5 hidden sm:inline-block" />
              <span className="relative z-10">Conductor</span>
            </button>
          </div>

          {/* Right Action: Clickable Points Pill (Passenger) or En Línea Toggle (Driver) + Quick Sign Out */}
          <div className="flex items-center justify-end gap-1 sm:gap-1.5 shrink-0">
            {!isDriver ? (
              <button
                type="button"
                onClick={() => {
                  setSheetExpanded(false);
                  setActiveTab('merchants');
                }}
                aria-label="Ver comercios y puntos"
                className="h-8 px-2 sm:px-2.5 rounded-full bg-amber-400/10 hover:bg-amber-400/15 border border-amber-400/25 flex items-center gap-1 sm:gap-1.5 text-xs font-mono-tabular transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <motion.span
                  key={profile.confirmedPoints}
                  initial={{scale: 1.15}}
                  animate={{scale: 1}}
                  className="font-bold text-amber-300"
                >
                  {profile.confirmedPoints}
                </motion.span>
                <span className="text-amber-300/80 hidden sm:inline">pts</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleDriverRoute}
                aria-label={driverUnit.isActive ? 'En línea' : 'Pausado'}
                className={`h-8 px-2 sm:px-2.5 rounded-full border flex items-center gap-1.5 text-[11px] font-bold transition-colors ${
                  driverUnit.isActive
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                    : 'bg-white/[0.04] border-white/[0.1] text-slate-400'
                }`}
              >
                <Radio className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">
                  {driverUnit.isActive ? 'En Línea' : 'Pausado'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Salir a pantalla de inicio"
              title="Salir"
              className="w-8 h-8 rounded-full text-slate-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Subtle Top Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              role="status"
              initial={{opacity: 0, y: -12}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -8}}
              transition={{duration: 0.2, ease: EASE}}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[700] w-[calc(100%-2rem)] max-w-sm pointer-events-none"
            >
              <div
                className={`rounded-2xl px-4 py-2.5 bg-[#131924]/95 backdrop-blur-xl border shadow-2xl flex items-center gap-2.5 ${
                  toast.tone === 'emerald'
                    ? 'border-emerald-500/40 text-emerald-100'
                    : toast.tone === 'amber'
                      ? 'border-amber-400/40 text-amber-100'
                      : toast.tone === 'red'
                        ? 'border-red-500/40 text-red-100'
                        : 'border-sky-400/40 text-sky-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight truncate">
                    {toast.title}
                  </p>
                  <p className="text-[11px] text-slate-300 truncate">
                    {toast.message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FULL-HEIGHT MAIN VIEWPORT (100% map between Top Bar and Bottom Nav — ZERO mid-screen split!) */}
        <main className="flex-1 relative min-h-0 overflow-hidden">
          {/* 100% Height Real Google Maps Canvas */}
          <div className="absolute inset-0">
            <CaracasTransitMap
              role={profile.role}
              stops={stops}
              units={units}
              merchants={merchants}
              userCoords={proof.userCoords}
              selectedStopId={originStop.id}
              focusTarget={focusTarget}
              highlightedSegment={highlightedSegment}
              showDemandHeatmap={isDriver}
              confirmedPoints={profile.confirmedPoints}
              onSelectStop={(stop) => {
                handleSelectCurrentStop(stop);
              }}
              onSimulateAtStop={(stop) => {
                handleSelectCurrentStop(stop);
                showToast('blue', `Parada: ${stop.name}`, 'Ubicación actualizada.');
              }}
              onRedeemMerchantFromMap={(merchant) => {
                void handleRedeemMerchant(merchant);
              }}
            />
          </div>

          {/* TOP-LEFT FLOATING STOP SELECTOR PILL (Change stop in 1 tap or tap any stop on the map) */}
          {activeTab === 'route' && (
            <div className="absolute top-3.5 left-3.5 z-20">
              <button
                type="button"
                onClick={() => setIsStopMenuOpen((prev) => !prev)}
                aria-expanded={isStopMenuOpen}
                aria-label="Cambiar parada activa"
                className="h-10 pl-3 pr-2.5 rounded-full bg-[#0C1017]/90 backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.22] shadow-lg flex items-center gap-2 transition-colors"
              >
                <MapPin
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isDriver ? 'text-sky-400' : 'text-emerald-400'
                  }`}
                />
                <span className="text-xs font-semibold text-white max-w-[145px] truncate">
                  {originStop.name}
                </span>
                <span className="font-mono-tabular text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                  {originStop.waitingCount}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isStopMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isStopMenuOpen && (
                  <>
                    <div
                      onClick={() => setIsStopMenuOpen(false)}
                      className="fixed inset-0 z-[-1]"
                      aria-hidden="true"
                    />
                    <motion.div
                      initial={{opacity: 0, y: -6, scale: 0.97}}
                      animate={{opacity: 1, y: 0, scale: 1}}
                      exit={{opacity: 0, y: -6, scale: 0.97}}
                      transition={{duration: 0.18, ease: EASE}}
                      className="mt-2 w-64 max-h-72 overflow-y-auto sheet-scroll rounded-2xl bg-[#0C1017]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl p-1.5"
                    >
                      <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Estaciones · Av. Fco. de Miranda
                      </p>
                      <div className="space-y-0.5">
                        {stops.map((st) => {
                          const isSelected = st.id === originStop.id;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => handleSelectCurrentStop(st)}
                              className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left transition-colors ${
                                isSelected
                                  ? isDriver
                                    ? 'bg-sky-500/15 text-sky-300'
                                    : 'bg-emerald-500/15 text-emerald-300'
                                  : 'text-slate-200 hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate">
                                  {st.name}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {st.zone}
                                </p>
                              </div>
                              <span
                                className={`font-mono-tabular text-[11px] font-bold shrink-0 ${
                                  st.waitingCount >= 14
                                    ? 'text-red-400'
                                    : 'text-amber-300'
                                }`}
                              >
                                {st.waitingCount} en fila
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* COLLAPSIBLE BOTTOM SHEET (Compact by default so map breathes; expands smoothly on tap or ^ arrow) */}
          {activeTab === 'route' && (
            <div className="absolute bottom-0 inset-x-0 lg:left-4 lg:right-auto lg:bottom-4 lg:w-[420px] z-30 pointer-events-none">
              <motion.section
                layout
                transition={{type: 'spring', stiffness: 360, damping: 34}}
                className="pointer-events-auto bg-[#0C1017]/95 backdrop-blur-xl border-t lg:border border-white/[0.1] rounded-t-3xl lg:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col max-h-[76vh]"
              >
                {/* Compact Header Bar — Always Visible & Clickable to Expand/Collapse */}
                <div className="px-4 pt-2.5 pb-3.5 shrink-0">
                  {/* Grab Handle */}
                  <button
                    type="button"
                    onClick={() => setSheetExpanded((prev) => !prev)}
                    aria-label={
                      sheetExpanded
                        ? 'Contraer tarjeta inferior'
                        : 'Expandir tarjeta inferior'
                    }
                    className="w-full pb-2.5 flex items-center justify-center group focus:outline-none"
                  >
                    <span className="w-9 h-1 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />
                  </button>

                  <div className="flex items-center justify-between gap-2.5">
                    {!isDriver ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSheetExpanded((prev) => !prev)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-display text-sm font-bold text-white truncate">
                              {originStop.name}
                            </span>
                            {originStop.metroStatus !== 'cerrado' && (
                              <span className="px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold shrink-0">
                                Metro
                              </span>
                            )}
                          </div>
                          {closestUnit && closestOcc ? (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              <span className="font-mono-tabular text-amber-300 font-semibold">
                                {originStop.waitingCount} en cola
                              </span>{' '}
                              ·{' '}
                              {closestUnit.transportType === 'metrobus'
                                ? 'Metrobús'
                                : 'Camionetica'}{' '}
                              <span className={closestOcc.colorClass}>
                                {closestOcc.label}
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {originStop.waitingCount} en cola · Toca para ver
                              unidades
                            </p>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSheetExpanded((prev) => !prev)}
                          aria-expanded={sheetExpanded}
                          aria-label={
                            sheetExpanded
                              ? 'Contraer tarjeta inferior'
                              : 'Expandir tarjeta inferior'
                          }
                          className="flex items-center gap-2.5 shrink-0"
                        >
                          <div className="text-right">
                            <span className="font-mono-tabular text-lg font-bold text-emerald-400 leading-none block">
                              {closestEta} min
                            </span>
                            <span className="text-[10px] text-slate-400">
                              más próxima
                            </span>
                          </div>
                          <span className="w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-slate-200">
                            {sheetExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setSheetExpanded((prev) => !prev)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                            <span className="truncate">
                              {originStop.name}
                            </span>
                            <ArrowRight className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {driverNextStop.name}
                            </span>
                          </div>
                          <p className="font-display text-sm font-extrabold text-white mt-0.5 truncate">
                            <span className="font-mono-tabular text-amber-300">
                              {driverUpcoming3Demand}
                            </span>{' '}
                            en cola{' '}
                            <span className="text-xs font-normal text-slate-400">
                              · {driverOnboard}/{driverCapacity} a bordo
                            </span>
                          </p>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <motion.button
                            type="button"
                            whileTap={{scale: 0.95}}
                            onClick={handleAdvanceDriverStop}
                            className="h-9 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5 shrink-0" />
                            <span>Siguiente</span>
                          </motion.button>
                          <button
                            type="button"
                            onClick={() => setSheetExpanded((prev) => !prev)}
                            aria-expanded={sheetExpanded}
                            aria-label={
                              sheetExpanded
                                ? 'Contraer tarjeta inferior'
                                : 'Expandir tarjeta inferior'
                            }
                            className="w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-slate-200"
                          >
                            {sheetExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Expandable Full Content Area */}
                <AnimatePresence initial={false}>
                  {sheetExpanded && (
                    <motion.div
                      key="sheet-expanded-body"
                      initial={{height: 0, opacity: 0}}
                      animate={{height: 'auto', opacity: 1}}
                      exit={{height: 0, opacity: 0}}
                      transition={{duration: 0.26, ease: EASE}}
                      className="overflow-hidden border-t border-white/[0.06]"
                    >
                      <div className="sheet-scroll max-h-[58vh] overflow-y-auto px-4 py-4 overscroll-contain">
                        {isDriver ? (
                          <DriverControlsSheet
                            driverUnit={driverUnit}
                            stops={stops}
                            currentStop={originStop}
                            nextStop={driverNextStop}
                            driverDirection={driverDirection}
                            shiftValidatedPassengers={shiftValidatedPassengers}
                            onAdvanceToNextStop={handleAdvanceDriverStop}
                            onToggleDriverDirection={(dir) =>
                              setDriverDirection(dir)
                            }
                            onToggleRouteActive={handleToggleDriverRoute}
                            onChangeOccupancy={handleChangeDriverOccupancy}
                            onFocusStop={(stop) => {
                              setFocusTarget({
                                lat: stop.lat,
                                lng: stop.lng,
                                zoom: 16,
                                ts: Date.now(),
                              });
                            }}
                            onReportAlert={handleReportRoadAlert}
                            onOpenQrModal={() => setIsDriverQrOpen(true)}
                          />
                        ) : (
                          <PassengerRouteSheet
                            stops={stops}
                            units={units}
                            originStop={originStop}
                            destinationStop={destinationStop}
                            proof={proof}
                            roadAlerts={roadAlerts}
                            nearbyMerchant={
                              merchants.find(
                                (m) => m.stopId === originStop.id
                              ) ?? null
                            }
                            onSelectDestinationStop={(stop) => {
                              setDestinationStopId(stop.id);
                              setFocusTarget({
                                lat: (originStop.lat + stop.lat) / 2,
                                lng: (originStop.lng + stop.lng) / 2,
                                zoom: 14,
                                ts: Date.now(),
                              });
                            }}
                            onSelectStop={(stop) => {
                              setFocusTarget({
                                lat: stop.lat,
                                lng: stop.lng,
                                zoom: 16,
                                ts: Date.now(),
                              });
                            }}
                            onCheckInClick={() => void handleCheckInClick()}
                            onOpenQrScanner={() => setIsQrScannerOpen(true)}
                            onOpenFareCalculator={() => setIsFareCalcOpen(true)}
                            onOpenMerchantsTab={() => {
                              setSheetExpanded(false);
                              setActiveTab('merchants');
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            </div>
          )}

          {/* DEDICATED FULL-HEIGHT OVERLAY FOR COMERCIOS & PERFIL (Zero map/content clash!) */}
          <AnimatePresence>
            {activeTab !== 'route' && (
              <motion.div
                key={`overlay-${activeTab}`}
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: 12}}
                transition={{duration: 0.22, ease: EASE}}
                className="absolute inset-0 z-40 bg-[#0C1017] overflow-hidden"
              >
                <AnimatedTransitBackground variant="surface" />
                <div className="relative z-10 h-full overflow-y-auto sheet-scroll">
                  <div className="max-w-xl mx-auto px-4 sm:px-6 py-5">
                  {activeTab === 'merchants' && !isDriver ? (
                    <MerchantsSheet
                      merchants={merchants}
                      confirmedPoints={profile.confirmedPoints}
                      activeTicket={latestActiveTicket}
                      onFocusMerchantOnMap={(merchant) => {
                        setActiveTab('route');
                        setSheetExpanded(false);
                        setFocusTarget({
                          lat: merchant.lat,
                          lng: merchant.lng,
                          zoom: 16,
                          ts: Date.now(),
                        });
                      }}
                      onRedeemMerchant={(merchant) =>
                        void handleRedeemMerchant(merchant)
                      }
                      onReopenActiveTicket={() => {
                        if (latestActiveTicket)
                          setOpenTicket(latestActiveTicket);
                      }}
                    />
                  ) : (
                    <ProfileSheet
                      profile={profile}
                      driverUnit={driverUnit}
                      shiftValidatedPassengers={shiftValidatedPassengers}
                      redemptions={redemptions}
                      onSwitchToDriver={handleSwitchToDriver}
                      onSwitchToPassenger={handleSwitchToPassenger}
                      onToggleDriverRoute={handleToggleDriverRoute}
                      onOpenDriverQr={() => setIsDriverQrOpen(true)}
                      onOpenTicket={(ticket) => setOpenTicket(ticket)}
                      onSignOut={() => void handleSignOut()}
                    />
                  )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* CLEAN DOCKED BOTTOM NAVIGATION BAR */}
        <nav
          aria-label="Navegación principal"
          className="h-16 grid grid-cols-3 border-t border-white/[0.06] bg-[#0C1017] shrink-0 px-2 z-50"
        >
          {!isDriver ? (
            (
              [
                {
                  id: 'route' as const,
                  label: 'Mapa',
                  Icon: MapPin,
                  activeText: 'text-emerald-400',
                  indicatorBg: 'bg-emerald-400',
                },
                {
                  id: 'merchants' as const,
                  label: 'Comercios',
                  Icon: ShoppingBag,
                  activeText: 'text-amber-400',
                  indicatorBg: 'bg-amber-400',
                },
                {
                  id: 'profile' as const,
                  label: 'Perfil',
                  Icon: User,
                  activeText: 'text-sky-400',
                  indicatorBg: 'bg-sky-400',
                },
              ] as const
            ).map(({id, label, Icon, activeText, indicatorBg}) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    setIsStopMenuOpen(false);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                    isActive
                      ? activeText
                      : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="bottomTabBarIndicator"
                      transition={{
                        type: 'spring',
                        stiffness: 460,
                        damping: 34,
                      }}
                      className={`absolute top-0 left-8 right-8 h-[2px] rounded-full ${indicatorBg}`}
                    />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-semibold leading-none">
                    {label}
                  </span>
                </button>
              );
            })
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('route');
                  setIsStopMenuOpen(false);
                }}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'route'
                    ? 'text-sky-400'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {activeTab === 'route' && (
                  <motion.span
                    layoutId="bottomTabBarIndicator"
                    transition={{type: 'spring', stiffness: 460, damping: 34}}
                    className="absolute top-0 left-8 right-8 h-[2px] rounded-full bg-sky-400"
                  />
                )}
                <MapPin className="w-5 h-5" />
                <span className="text-[11px] font-semibold leading-none">
                  Mapa y Cola
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsDriverQrOpen(true)}
                className="relative flex flex-col items-center justify-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
              >
                <QrCode className="w-5 h-5" />
                <span className="text-[11px] font-semibold leading-none">
                  QR Cobro
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('profile');
                  setIsStopMenuOpen(false);
                }}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'profile'
                    ? 'text-sky-400'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {activeTab === 'profile' && (
                  <motion.span
                    layoutId="bottomTabBarIndicator"
                    transition={{type: 'spring', stiffness: 460, damping: 34}}
                    className="absolute top-0 left-8 right-8 h-[2px] rounded-full bg-sky-400"
                  />
                )}
                <User className="w-5 h-5" />
                <span className="text-[11px] font-semibold leading-none">
                  Perfil
                </span>
              </button>
            </>
          )}
        </nav>

        {/* Modals */}
        <FareCalculatorModal
          isOpen={isFareCalcOpen}
          onClose={() => setIsFareCalcOpen(false)}
        />

        <UnitQrScannerModal
          isOpen={isQrScannerOpen}
          units={units}
          onClose={() => setIsQrScannerOpen(false)}
          onValidateCode={proof.validateWithUnitQr}
        />

        <AnimatedTicketModal
          ticket={openTicket}
          onClose={() => setOpenTicket(null)}
        />

        <DriverQrModal
          isOpen={isDriverQrOpen}
          unit={driverUnit}
          onClose={() => setIsDriverQrOpen(false)}
        />
      </div>
    </APIProvider>
  );
}
