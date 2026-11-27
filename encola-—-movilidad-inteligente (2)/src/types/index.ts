export type UserRole = 'passenger' | 'driver';

export type TransportType = 'camioneta' | 'metro' | 'metrobus';

export type OccupancyStatus = 'libre' | 'de_pie' | 'full';

export type MetroStatus = 'fluido' | 'retraso' | 'cerrado';

export type MerchantCategory = 'all' | 'cafe' | 'comida' | 'saldo';

export type PassengerTab = 'route' | 'merchants' | 'profile';

export type RoadAlertType = 'traffic' | 'full' | 'detour' | 'checkpoint';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarInitials: string;
  avatarUrl?: string;
  role: UserRole;
  unitCode: string | null;
  confirmedPoints: number;
  pendingPoints: number;
  isDemo: boolean;
}

export interface TransitStop {
  id: string;
  slug: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  transportTypes: TransportType[];
  waitingCount: number;
  metroStatus: MetroStatus;
  routeIndex: number; // Position along Av. Francisco de Miranda route
}

export interface ActiveUnit {
  id: string;
  unitCode: string;
  plate: string;
  driverName: string;
  routeName: string;
  transportType: 'camioneta' | 'metrobus';
  lat: number;
  lng: number;
  speedKmh: number;
  occupancy: OccupancyStatus;
  isActive: boolean;
  direction: 1 | -1;
  routeProgress: number; // 0..1 along polyline for fluid demo simulation
  isUserDriverUnit?: boolean;
  pagoMovil: {
    bank: string;
    phone: string;
    idNumber: string;
    fareBs: number;
  };
}

export interface RoadAlert {
  id: string;
  type: RoadAlertType;
  label: string;
  stopName: string;
  timeAgo: string;
  reporter: string;
}

export interface PendingQueueReport {
  id: string;
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLng: number;
  pointsAwarded: number;
  reportedAt: number;
  status: 'pending' | 'confirmed';
}

export interface Merchant {
  id: string;
  name: string;
  category: Exclude<MerchantCategory, 'all'>;
  emoji: string;
  stopId: string;
  lat: number;
  lng: number;
  referenceStop: string;
  offerTitle: string;
  offerDescription: string;
  pointsCost: number;
  imageUrl: string;
}

export interface RedemptionTicket {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantEmoji: string;
  referenceStop: string;
  offerTitle: string;
  code: string;
  pointsSpent: number;
  createdAt: number;
  expiresAt: number; // timestamp in ms (createdAt + 3 * 60 * 1000)
}

export interface TransitNotification {
  id: string;
  tone: 'emerald' | 'amber' | 'blue' | 'red';
  title: string;
  message: string;
}
