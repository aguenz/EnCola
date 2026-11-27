import React, {useEffect, useMemo, useState} from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  useApiIsLoaded,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {AnimatePresence, motion} from 'motion/react';
import {
  Activity,
  Crosshair,
  Layers,
  Store,
} from 'lucide-react';
import {
  AV_FRANCISCO_DE_MIRANDA_ROUTE,
  CARACAS_CENTER,
} from '../../lib/caracasData';
import {interpolateAlongRoute} from '../../lib/geo';
import type {
  ActiveUnit,
  Coordinates,
  Merchant,
  MetroStatus,
  OccupancyStatus,
  TransitStop,
  UserRole,
} from '../../types';

// Official Google Maps Platform React integration:
// https://developers.google.com/maps/documentation/javascript/advanced-markers/overview?utm_campaign=gmp_mcp_codeassist_v1_aistudio

type GoogleMapTypeOption = 'roadmap' | 'hybrid' | 'satellite' | 'terrain';

const MAP_TYPES: Record<GoogleMapTypeOption, string> = {
  roadmap: 'Mapa',
  hybrid: 'Híbrido',
  satellite: 'Satélite',
  terrain: 'Relieve',
};

const MAP_TYPE_ORDER: GoogleMapTypeOption[] = [
  'roadmap',
  'hybrid',
  'satellite',
  'terrain',
];

const CARACAS_CENTER_LITERAL = {
  lat: CARACAS_CENTER[0],
  lng: CARACAS_CENTER[1],
};

const CORRIDOR_PATH: google.maps.LatLngLiteral[] =
  AV_FRANCISCO_DE_MIRANDA_ROUTE.map(([lat, lng]) => ({lat, lng}));

const METRO_PATH: google.maps.LatLngLiteral[] =
  AV_FRANCISCO_DE_MIRANDA_ROUTE.map(([lat, lng]) => ({
    lat: lat - 0.00038,
    lng,
  }));

interface CaracasTransitMapProps {
  role: UserRole;
  stops: TransitStop[];
  units: ActiveUnit[];
  merchants: Merchant[];
  userCoords: Coordinates;
  selectedStopId: string | null;
  focusTarget: {lat: number; lng: number; zoom?: number; ts: number} | null;
  highlightedSegment?: [number, number][];
  showDemandHeatmap: boolean;
  confirmedPoints: number;
  backgroundOnly?: boolean;
  isMapExpandedMobile?: boolean;
  onToggleExpandMobile?: () => void;
  onSelectStop: (stop: TransitStop) => void;
  onSimulateAtStop: (stop: TransitStop) => void;
  onRedeemMerchantFromMap: (merchant: Merchant) => void;
}

type ActivePopup =
  | {kind: 'stop'; id: string}
  | {kind: 'unit'; id: string}
  | {kind: 'merchant'; id: string}
  | null;

function getQueueSeverity(count: number): {
  bg: string;
  text: string;
  label: string;
  statusWord: string;
} {
  if (count >= 12) {
    return {
      bg: '#EF4444',
      text: '#FFFFFF',
      label: String(count),
      statusWord: 'Alta demanda',
    };
  }
  if (count >= 7) {
    return {
      bg: '#F59E0B',
      text: '#0C1017',
      label: String(count),
      statusWord: 'Moderada',
    };
  }
  return {
    bg: '#10B981',
    text: '#0C1017',
    label: String(count),
    statusWord: 'Fluido',
  };
}

function getOccupancyInfo(occupancy: OccupancyStatus): {
  label: string;
  color: string;
} {
  switch (occupancy) {
    case 'libre':
      return {label: 'Asientos libres', color: '#10B981'};
    case 'de_pie':
      return {label: 'De pie', color: '#F59E0B'};
    case 'full':
      return {label: 'Full · No se para', color: '#EF4444'};
  }
}

function getMetroStatusInfo(status: MetroStatus): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'fluido':
      return {label: 'Fluido', color: '#10B981'};
    case 'retraso':
      return {label: 'Retraso', color: '#F59E0B'};
    case 'cerrado':
      return {label: 'Cerrado', color: '#EF4444'};
  }
}

/** Custom side-profile Venezuelan Camionetica / Encava minibus SVG */
const CamioneticaVehicleIcon: React.FC<{flip?: boolean}> = ({flip = false}) => (
  <svg
    width="26"
    height="16"
    viewBox="0 0 36 22"
    fill="none"
    style={{transform: flip ? 'scaleX(-1)' : undefined}}
    aria-hidden="true"
  >
    {/* Body */}
    <path
      d="M4 15.5V7.5C4 5.3 5.8 3.5 8 3.5H24.5C27.2 3.5 29.6 5 30.8 7.4L32.4 10.5C32.8 11.3 33 12.1 33 13V15.5C33 16.3 32.3 17 31.5 17H5.5C4.7 17 4 16.3 4 15.5Z"
      fill="#10B981"
      stroke="#064E3B"
      strokeWidth="1.2"
    />
    {/* Panoramic Windshield & Windows */}
    <path
      d="M23.5 5.4H26.4C27.8 5.4 29 6.2 29.6 7.4L30.8 9.8H23.5V5.4Z"
      fill="#CFFAFE"
    />
    <rect x="6.5" y="5.6" width="6.5" height="4.2" rx="1.1" fill="#A7F3D0" />
    <rect x="14.5" y="5.6" width="7.2" height="4.2" rx="1.1" fill="#A7F3D0" />
    {/* Classic Caracas stripe & headlight */}
    <rect x="4.5" y="11.5" width="27.5" height="1.8" fill="#ECFDF5" opacity="0.9" />
    <circle cx="31.5" cy="13.5" r="1.4" fill="#FDE047" />
    {/* Wheels */}
    <circle cx="10.5" cy="17.2" r="3" fill="#0C1017" stroke="#E2E8F0" strokeWidth="1.3" />
    <circle cx="26.2" cy="17.2" r="3" fill="#0C1017" stroke="#E2E8F0" strokeWidth="1.3" />
  </svg>
);

/** Custom sleek articulated Metrobús city bus SVG */
const MetrobusVehicleIcon: React.FC<{flip?: boolean}> = ({flip = false}) => (
  <svg
    width="28"
    height="16"
    viewBox="0 0 40 22"
    fill="none"
    style={{transform: flip ? 'scaleX(-1)' : undefined}}
    aria-hidden="true"
  >
    {/* Long sleek low-floor chassis */}
    <rect
      x="3"
      y="3.5"
      width="33.5"
      height="13.5"
      rx="3.2"
      fill="#0284C7"
      stroke="#0C4A6E"
      strokeWidth="1.2"
    />
    {/* Roof AC pod */}
    <rect x="12" y="1.8" width="12" height="2" rx="1" fill="#BAE6FD" />
    {/* Triple panoramic windows */}
    <rect x="5.4" y="5.5" width="7.5" height="4.8" rx="1.1" fill="#E0F2FE" />
    <rect x="14.2" y="5.5" width="8.5" height="4.8" rx="1.1" fill="#E0F2FE" />
    <rect x="24" y="5.5" width="10.2" height="4.8" rx="1.3" fill="#BAE6FD" />
    {/* LED route strip + bright headlight */}
    <rect x="4" y="12" width="31.5" height="1.7" fill="#38BDF8" />
    <rect x="34.2" y="12.6" width="2.2" height="2.2" rx="0.8" fill="#FEF08A" />
    {/* Wheels */}
    <circle cx="10.5" cy="17.2" r="2.9" fill="#0C1017" stroke="#E2E8F0" strokeWidth="1.3" />
    <circle cx="29" cy="17.2" r="2.9" fill="#0C1017" stroke="#E2E8F0" strokeWidth="1.3" />
  </svg>
);

/** Custom sleek Metro Línea 1 aerodynamic train SVG */
const MetroTrainVehicleIcon: React.FC<{flip?: boolean}> = ({flip = false}) => (
  <svg
    width="26"
    height="15"
    viewBox="0 0 38 22"
    fill="none"
    style={{transform: flip ? 'scaleX(-1)' : undefined}}
    aria-hidden="true"
  >
    {/* Streamlined Metro car body */}
    <path
      d="M3.5 14.5V7.2C3.5 5.1 5.2 3.5 7.3 3.5H27.8C31.2 3.5 34.1 6.1 35 9.5L35.6 12.2C36 14.4 34.4 16.5 32.1 16.5H5.5C4.4 16.5 3.5 15.6 3.5 14.5Z"
      fill="#F97316"
      stroke="#7C2D12"
      strokeWidth="1.2"
    />
    {/* Metallic stripe & dark aero cab window */}
    <path
      d="M25.5 5.4H28.3C30.4 5.4 32.2 6.8 32.8 8.8L33.2 10.2H25.5V5.4Z"
      fill="#0F172A"
    />
    <rect x="6" y="5.6" width="7.2" height="4.4" rx="1.2" fill="#FFEDD5" />
    <rect x="14.8" y="5.6" width="8.6" height="4.4" rx="1.2" fill="#FFEDD5" />
    <rect x="4" y="12" width="30.5" height="1.8" fill="#FFFFFF" opacity="0.92" />
    <circle cx="33.5" cy="13.8" r="1.4" fill="#FEF08A" />
    {/* Rail bogies */}
    <rect x="7.5" y="16.8" width="6.5" height="2" rx="1" fill="#CBD5E1" />
    <rect x="23" y="16.8" width="6.5" height="2" rx="1" fill="#CBD5E1" />
  </svg>
);

const GoogleMapOverlays: React.FC<{
  role: UserRole;
  stops: TransitStop[];
  userCoords: Coordinates;
  highlightedSegment?: [number, number][];
  showDemandHeatmap: boolean;
  showTraffic: boolean;
  backgroundOnly: boolean;
  focusTarget: {lat: number; lng: number; zoom?: number; ts: number} | null;
}> = ({
  role,
  stops,
  userCoords,
  highlightedSegment,
  showDemandHeatmap,
  showTraffic,
  backgroundOnly,
  focusTarget,
}) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !focusTarget) return;
    map.panTo({lat: focusTarget.lat, lng: focusTarget.lng});
    if (focusTarget.zoom !== undefined) {
      map.setZoom(focusTarget.zoom);
    }
  }, [map, focusTarget]);

  useEffect(() => {
    if (!map || !mapsLib || !showTraffic) return;
    const trafficLayer = new mapsLib.TrafficLayer();
    trafficLayer.setMap(map);
    return () => {
      trafficLayer.setMap(null);
    };
  }, [map, mapsLib, showTraffic]);

  useEffect(() => {
    if (!map || !mapsLib) return;
    const hasHighlight = Boolean(
      highlightedSegment && highlightedSegment.length >= 2
    );

    const casingLine = new mapsLib.Polyline({
      path: CORRIDOR_PATH,
      strokeColor: '#0C1017',
      strokeOpacity: hasHighlight ? 0.35 : 0.72,
      strokeWeight: 9,
      zIndex: 10,
      map,
    });

    const emeraldLine = new mapsLib.Polyline({
      path: CORRIDOR_PATH,
      strokeColor: '#10B981',
      strokeOpacity: hasHighlight ? 0.38 : 0.92,
      strokeWeight: 4.5,
      zIndex: 11,
      map,
    });

    const metroLine = new mapsLib.Polyline({
      path: METRO_PATH,
      strokeColor: '#F97316',
      strokeOpacity: 0,
      strokeWeight: 3,
      icons: [
        {
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: hasHighlight ? 0.4 : 0.75,
            scale: 2.8,
          },
          offset: '0',
          repeat: '16px',
        },
      ],
      zIndex: 12,
      map,
    });

    return () => {
      casingLine.setMap(null);
      emeraldLine.setMap(null);
      metroLine.setMap(null);
    };
  }, [map, mapsLib, highlightedSegment]);

  // Active Trayecto Segment Highlight (Screen 3)
  useEffect(() => {
    if (
      !map ||
      !mapsLib ||
      backgroundOnly ||
      !highlightedSegment ||
      highlightedSegment.length < 2
    ) {
      return;
    }

    const segmentPath: google.maps.LatLngLiteral[] = highlightedSegment.map(
      ([lat, lng]) => ({lat, lng})
    );

    const segmentCasing = new mapsLib.Polyline({
      path: segmentPath,
      strokeColor: '#0C1017',
      strokeOpacity: 0.9,
      strokeWeight: 11,
      zIndex: 13,
      map,
    });

    const segmentFill = new mapsLib.Polyline({
      path: segmentPath,
      strokeColor: role === 'driver' ? '#FBBF24' : '#38BDF8',
      strokeOpacity: 1,
      strokeWeight: 6,
      zIndex: 14,
      map,
    });

    return () => {
      segmentCasing.setMap(null);
      segmentFill.setMap(null);
    };
  }, [map, mapsLib, backgroundOnly, highlightedSegment, role]);

  // Passenger 50m Haversine Geofence Circle
  useEffect(() => {
    if (!map || !mapsLib || backgroundOnly || role !== 'passenger') return;
    const geofence = new mapsLib.Circle({
      center: {lat: userCoords.lat, lng: userCoords.lng},
      radius: 50,
      strokeColor: '#38BDF8',
      strokeOpacity: 0.75,
      strokeWeight: 1.5,
      fillColor: '#38BDF8',
      fillOpacity: 0.14,
      zIndex: 8,
      map,
    });
    return () => {
      geofence.setMap(null);
    };
  }, [map, mapsLib, backgroundOnly, role, userCoords.lat, userCoords.lng]);

  // Driver High-Demand Hotspot Circles (12+ waiting)
  useEffect(() => {
    if (!map || !mapsLib || backgroundOnly || !showDemandHeatmap) return;
    const hotspotCircles = stops
      .filter((s) => s.waitingCount >= 12)
      .map(
        (stop) =>
          new mapsLib.Circle({
            center: {lat: stop.lat, lng: stop.lng},
            radius: 165,
            strokeColor: '#EF4444',
            strokeOpacity: 0.75,
            strokeWeight: 1.5,
            fillColor: '#EF4444',
            fillOpacity: 0.2,
            zIndex: 9,
            map,
          })
      );

    return () => {
      hotspotCircles.forEach((c) => c.setMap(null));
    };
  }, [map, mapsLib, backgroundOnly, showDemandHeatmap, stops]);

  return null;
};

export const CaracasTransitMap: React.FC<CaracasTransitMapProps> = ({
  role,
  stops,
  units,
  merchants,
  userCoords,
  selectedStopId,
  focusTarget,
  highlightedSegment,
  showDemandHeatmap,
  confirmedPoints,
  backgroundOnly = false,
  isMapExpandedMobile = false,
  onToggleExpandMobile,
  onSelectStop,
  onSimulateAtStop,
  onRedeemMerchantFromMap,
}) => {
  const isApiLoaded = useApiIsLoaded();
  const [mapTypeId, setMapTypeId] = useState<GoogleMapTypeOption>('roadmap');
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [activePopup, setActivePopup] = useState<ActivePopup>(null);
  const [localFocus, setLocalFocus] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    ts: number;
  } | null>(null);

  const activeFocus = useMemo(() => {
    if (!focusTarget) return localFocus;
    if (!localFocus) return focusTarget;
    return focusTarget.ts >= localFocus.ts ? focusTarget : localFocus;
  }, [focusTarget, localFocus]);

  const selectedStopPopup =
    activePopup?.kind === 'stop'
      ? stops.find((s) => s.id === activePopup.id) ?? null
      : null;

  const selectedUnitPopup =
    activePopup?.kind === 'unit'
      ? units.find((u) => u.id === activePopup.id && u.isActive) ?? null
      : null;

  const selectedMerchantPopup =
    activePopup?.kind === 'merchant'
      ? merchants.find((m) => m.id === activePopup.id) ?? null
      : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0C1017]">
      {!isApiLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0C1017] text-slate-400 text-xs font-medium">
          Cargando Google Maps...
        </div>
      )}

      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        defaultCenter={CARACAS_CENTER_LITERAL}
        defaultZoom={14}
        mapTypeId={mapTypeId}
        gestureHandling={backgroundOnly ? 'none' : 'greedy'}
        disableDefaultUI
        clickableIcons={!backgroundOnly}
        onClick={() => {
          setActivePopup(null);
          setLayerMenuOpen(false);
        }}
        style={{width: '100%', height: '100%'}}
      >
        <GoogleMapOverlays
          role={role}
          stops={stops}
          userCoords={userCoords}
          highlightedSegment={highlightedSegment}
          showDemandHeatmap={showDemandHeatmap}
          showTraffic={showTraffic}
          backgroundOnly={backgroundOnly}
          focusTarget={activeFocus}
        />

        {/* Passenger Live GPS Beacon */}
        {!backgroundOnly && role === 'passenger' && (
          <AdvancedMarker
            position={{lat: userCoords.lat, lng: userCoords.lng}}
            title="Tu ubicación GPS"
            zIndex={40}
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <span className="radar-ping-ring absolute inset-0 rounded-full bg-sky-400/35 border border-sky-400" />
              <span className="relative w-3.5 h-3.5 rounded-full bg-sky-400 border-2 border-white shadow-md" />
            </div>
          </AdvancedMarker>
        )}

        {/* Clean, Low-Noise Stop Markers */}
        {stops.map((stop) => {
          const sev = getQueueSeverity(stop.waitingCount);
          const isHighDemand =
            !backgroundOnly && showDemandHeatmap && stop.waitingCount >= 12;
          const isSelected = selectedStopId === stop.id;
          const shortName =
            stop.slug === 'plaza-venezuela'
              ? 'Plz. Vzla'
              : stop.slug === 'los-cortijos'
                ? 'Cortijos'
                : stop.slug === 'parque-del-este'
                  ? 'P. Cristal'
                  : stop.slug === 'la-california'
                    ? 'California'
                    : stop.name;

          return (
            <AdvancedMarker
              key={stop.id}
              position={{lat: stop.lat, lng: stop.lng}}
              title={`${stop.name} (${stop.waitingCount} en fila)`}
              zIndex={isSelected ? 35 : 25}
              onClick={() => {
                if (backgroundOnly) return;
                onSelectStop(stop);
                setActivePopup({kind: 'stop', id: stop.id});
              }}
            >
              <div className="relative flex items-center justify-center cursor-pointer select-none">
                {isHighDemand && (
                  <span className="demand-pulse-ring pointer-events-none absolute w-12 h-12 rounded-full bg-red-500/30 border border-red-400" />
                )}
                <div
                  className={`relative inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full transition-transform ${
                    isSelected
                      ? 'bg-[#0C1017] text-white scale-105 ring-2 ring-sky-400 shadow-lg'
                      : 'bg-[#0C1017]/90 text-slate-200 border border-white/20 shadow-md'
                  }`}
                >
                  <span
                    className="min-w-[18px] h-[18px] px-1 rounded-full font-mono-tabular text-[10px] font-bold inline-flex items-center justify-center"
                    style={{backgroundColor: sev.bg, color: sev.text}}
                  >
                    {sev.label}
                  </span>
                  <span className="font-display text-[10px] font-semibold whitespace-nowrap">
                    {shortName}
                  </span>
                </div>
              </div>
            </AdvancedMarker>
          );
        })}

        {/* Active Moving Units (Custom Camionetica & Metrobús Directional Icons) */}
        {units
          .filter((u) => u.isActive)
          .map((unit) => {
            const isMetrobus = unit.transportType === 'metrobus';
            const occ = getOccupancyInfo(unit.occupancy);
            const flipWest = unit.direction === -1;
            const ringBorder = unit.isUserDriverUnit
              ? '#FBBF24'
              : isMetrobus
                ? '#38BDF8'
                : '#34D399';

            return (
              <AdvancedMarker
                key={unit.id}
                position={{lat: unit.lat, lng: unit.lng}}
                title={`${unit.unitCode} · ${occ.label}`}
                zIndex={unit.isUserDriverUnit ? 42 : 38}
                onClick={() => {
                  if (backgroundOnly) return;
                  setActivePopup({kind: 'unit', id: unit.id});
                }}
              >
                <div className="relative flex flex-col items-center cursor-pointer select-none group">
                  {unit.isUserDriverUnit && (
                    <span className="radar-ping-ring pointer-events-none absolute -inset-1.5 rounded-full bg-amber-400/25 border border-amber-400/70" />
                  )}
                  <div
                    className="relative px-2 py-1.5 rounded-2xl bg-[#0C1017]/95 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.65)] flex items-center gap-1.5 transition-transform group-hover:scale-110"
                    style={{
                      border: `2px solid ${ringBorder}`,
                    }}
                  >
                    {isMetrobus ? (
                      <MetrobusVehicleIcon flip={flipWest} />
                    ) : (
                      <CamioneticaVehicleIcon flip={flipWest} />
                    )}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: occ.color,
                        boxShadow: `0 0 8px ${occ.color}`,
                      }}
                    />
                  </div>
                  <span
                    className="mt-0.5 px-1.5 py-[1px] rounded-md bg-[#0C1017]/90 font-mono-tabular text-[9px] font-bold tracking-tight border border-white/10"
                    style={{color: isMetrobus ? '#7DD3FC' : '#6EE7B7'}}
                  >
                    {isMetrobus ? 'MB' : unit.plate.slice(0, 6)}
                  </span>
                </div>
              </AdvancedMarker>
            );
          })}

        {/* Live Metro Línea 1 Train Marker gliding along the orange Metro path */}
        {(() => {
          const leadUnit = units[0];
          const metroProg = leadUnit
            ? (leadUnit.routeProgress + 0.42) % 1
            : 0.45;
          const metroPos = interpolateAlongRoute(
            AV_FRANCISCO_DE_MIRANDA_ROUTE,
            metroProg
          );
          return (
            <AdvancedMarker
              position={{lat: metroPos.lat - 0.00038, lng: metroPos.lng}}
              title="Metro Línea 1 · Dirección Palo Verde"
              zIndex={36}
            >
              <div className="relative flex flex-col items-center select-none pointer-events-none">
                <div className="px-2 py-1.5 rounded-2xl bg-[#0C1017]/95 border-2 border-orange-400 shadow-[0_8px_18px_rgba(249,115,22,0.35)] flex items-center gap-1">
                  <MetroTrainVehicleIcon />
                </div>
                <span className="mt-0.5 px-1.5 py-[1px] rounded-md bg-[#0C1017]/90 font-mono-tabular text-[9px] font-bold text-orange-300 border border-orange-400/30">
                  L1
                </span>
              </div>
            </AdvancedMarker>
          );
        })()}

        {/* Allied Merchant Pins (Passenger Only, crisp vector Store badge) */}
        {!backgroundOnly &&
          role === 'passenger' &&
          merchants.map((merchant) => (
            <AdvancedMarker
              key={merchant.id}
              position={{lat: merchant.lat, lng: merchant.lng}}
              title={`${merchant.name} · ${merchant.offerTitle}`}
              zIndex={28}
              onClick={() => setActivePopup({kind: 'merchant', id: merchant.id})}
            >
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 border-2 border-[#0C1017] shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <Store className="w-3.5 h-3.5 stroke-[2.4]" />
              </div>
            </AdvancedMarker>
          ))}

        {/* Stop InfoWindow */}
        {selectedStopPopup && !backgroundOnly && (
          <InfoWindow
            position={{lat: selectedStopPopup.lat, lng: selectedStopPopup.lng}}
            pixelOffset={[0, -22]}
            onCloseClick={() => setActivePopup(null)}
          >
            <div className="w-[232px] p-3.5 bg-[#131924] text-slate-100 space-y-2.5">
              <div className="pr-5">
                <p className="font-display text-sm font-bold text-white leading-tight">
                  {selectedStopPopup.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedStopPopup.zone}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="font-mono-tabular font-semibold text-white">
                  {selectedStopPopup.waitingCount} en fila
                </span>
                <span
                  className="font-semibold"
                  style={{
                    color: getMetroStatusInfo(selectedStopPopup.metroStatus)
                      .color,
                  }}
                >
                  Metro {getMetroStatusInfo(selectedStopPopup.metroStatus).label}
                </span>
              </div>
              {role === 'passenger' && (
                <button
                  type="button"
                  onClick={() => {
                    onSimulateAtStop(selectedStopPopup);
                    setActivePopup(null);
                  }}
                  className="w-full min-h-[36px] rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                >
                  Seleccionar como mi parada
                </button>
              )}
            </div>
          </InfoWindow>
        )}

        {/* Active Unit InfoWindow */}
        {selectedUnitPopup && !backgroundOnly && (
          <InfoWindow
            position={{lat: selectedUnitPopup.lat, lng: selectedUnitPopup.lng}}
            pixelOffset={[0, -22]}
            onCloseClick={() => setActivePopup(null)}
          >
            <div className="w-[232px] p-3.5 bg-[#131924] text-slate-100 space-y-2">
              <div className="flex items-center justify-between gap-2 pr-5">
                <span className="font-mono-tabular text-xs font-bold text-white">
                  {selectedUnitPopup.unitCode} · {selectedUnitPopup.plate}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                {selectedUnitPopup.routeName}
              </p>
              <p className="text-[11px] text-slate-400">
                Conductor: {selectedUnitPopup.driverName}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span
                  style={{
                    color: getOccupancyInfo(selectedUnitPopup.occupancy).color,
                  }}
                  className="font-semibold"
                >
                  {getOccupancyInfo(selectedUnitPopup.occupancy).label}
                </span>
                <span className="font-mono-tabular text-slate-300">
                  {selectedUnitPopup.pagoMovil.fareBs} Bs
                </span>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Merchant InfoWindow */}
        {selectedMerchantPopup && !backgroundOnly && (
          <InfoWindow
            position={{
              lat: selectedMerchantPopup.lat,
              lng: selectedMerchantPopup.lng,
            }}
            pixelOffset={[0, -22]}
            onCloseClick={() => setActivePopup(null)}
          >
            <div className="w-[240px] bg-[#131924] text-slate-100 overflow-hidden">
              <div className="relative h-24 w-full bg-slate-900">
                <img
                  src={selectedMerchantPopup.imageUrl}
                  alt={selectedMerchantPopup.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131924] via-transparent to-transparent" />
                <span className="absolute bottom-1.5 right-2.5 font-mono-tabular text-xs font-bold text-amber-300 bg-[#0C1017]/90 px-2 py-0.5 rounded-lg">
                  {selectedMerchantPopup.pointsCost} pts
                </span>
              </div>
              <div className="p-3 space-y-2">
                <p className="font-display text-sm font-bold text-white leading-tight">
                  {selectedMerchantPopup.name}
                </p>
                <p className="text-xs font-semibold text-amber-300">
                  {selectedMerchantPopup.offerTitle}
                </p>
                {role === 'passenger' && (
                  <button
                    type="button"
                    onClick={() => {
                      onRedeemMerchantFromMap(selectedMerchantPopup);
                      setActivePopup(null);
                    }}
                    disabled={
                      confirmedPoints < selectedMerchantPopup.pointsCost
                    }
                    className={`w-full min-h-[36px] rounded-xl font-bold text-xs transition-colors ${
                      confirmedPoints >= selectedMerchantPopup.pointsCost
                        ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                        : 'bg-white/10 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {confirmedPoints >= selectedMerchantPopup.pointsCost
                      ? 'Canjear aquí'
                      : `Faltan ${selectedMerchantPopup.pointsCost - confirmedPoints} pts`}
                  </button>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Quiet, Minimal Top-Right Controls Inside the Full-Height Map */}
      {!backgroundOnly && (
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
          {/* Compact Layers & Traffic Popover */}
          <div className="relative">
            <motion.button
              type="button"
              whileTap={{scale: 0.94}}
              onClick={() => setLayerMenuOpen((prev) => !prev)}
              aria-label="Capas de Google Maps"
              className={`map-control-btn w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                layerMenuOpen || showTraffic
                  ? 'text-emerald-400'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {layerMenuOpen && (
                <motion.div
                  initial={{opacity: 0, y: -8, scale: 0.96}}
                  animate={{opacity: 1, y: 0, scale: 1}}
                  exit={{opacity: 0, y: -6, scale: 0.96}}
                  transition={{duration: 0.16, ease: [0.16, 1, 0.3, 1]}}
                  className="absolute top-12 right-0 w-44 rounded-2xl bg-[#131924] border border-white/10 shadow-2xl p-1.5 space-y-1"
                >
                  {MAP_TYPE_ORDER.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setMapTypeId(id);
                        setLayerMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors ${
                        mapTypeId === id
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{MAP_TYPES[id]}</span>
                      {mapTypeId === id && <span>✓</span>}
                    </button>
                  ))}
                  <div className="pt-1 mt-1 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setShowTraffic((prev) => !prev)}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors ${
                        showTraffic
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        Tráfico real
                      </span>
                      <span>{showTraffic ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recenter GPS Button */}
          <motion.button
            type="button"
            whileTap={{scale: 0.94}}
            onClick={() =>
              setLocalFocus({
                lat: userCoords.lat,
                lng: userCoords.lng,
                zoom: 15,
                ts: Date.now(),
              })
            }
            aria-label="Centrar en mi ubicación"
            className="map-control-btn w-10 h-10 rounded-xl flex items-center justify-center text-sky-400 hover:text-sky-300 transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </div>
  );
};
