import type {ActiveUnit, Merchant, RoadAlert, TransitStop} from '../types';

/**
 * Realistic Av. Francisco de Miranda corridor in Caracas:
 * Plaza Venezuela -> Chacaíto -> Chacao -> Altamira -> Parque Cristal / Miranda -> Los Cortijos -> La California -> Petare
 */
export const AV_FRANCISCO_DE_MIRANDA_ROUTE: [number, number][] = [
  [10.4962, -66.8856], // 0: Plaza Venezuela
  [10.4946, -66.8805], // 1: Sabana Grande
  [10.4926, -66.8748], // 2: Av. Casanova este
  [10.4906, -66.8689], // 3: Chacaíto
  [10.4912, -66.8632], // 4: Centro Lido oeste
  [10.4923, -66.8588], // 5: El Rosal
  [10.4932, -66.8548], // 6: Chacao
  [10.4951, -66.8515], // 7: Altamira oeste
  [10.4961, -66.8489], // 8: Altamira (Plaza Francia)
  [10.4966, -66.8421], // 9: Parque Cristal / Los Palos Grandes
  [10.4959, -66.8364], // 10: Parque del Este / Miranda
  [10.4949, -66.8294], // 11: Los Dos Caminos
  [10.4934, -66.8245], // 12: Los Cortijos
  [10.4892, -66.8172], // 13: C.C. Líder / La California
  [10.4841, -66.8114], // 14: Av. Fco. de Miranda / Boleíta Sur
  [10.4789, -66.8058], // 15: Redoma de Petare (Terminal)
];

export const CARACAS_CENTER: [number, number] = [10.4918, -66.846];

export const INITIAL_STOPS: TransitStop[] = [
  {
    id: 'stop-plaza-vzla',
    slug: 'plaza-venezuela',
    name: 'Plaza Venezuela',
    zone: 'Torre La Previsora · Conexión L1/L3',
    lat: 10.4962,
    lng: -66.8856,
    transportTypes: ['camioneta', 'metro', 'metrobus'],
    waitingCount: 16,
    metroStatus: 'retraso',
    routeIndex: 0,
  },
  {
    id: 'stop-chacaito',
    slug: 'chacaito',
    name: 'Chacaíto',
    zone: 'Bulevar Sabana Grande · Terminal',
    lat: 10.4906,
    lng: -66.8689,
    transportTypes: ['camioneta', 'metro', 'metrobus'],
    waitingCount: 14,
    metroStatus: 'fluido',
    routeIndex: 3,
  },
  {
    id: 'stop-chacao',
    slug: 'chacao',
    name: 'Chacao',
    zone: 'Plaza Brión · Centro Lido',
    lat: 10.4932,
    lng: -66.8548,
    transportTypes: ['camioneta', 'metro', 'metrobus'],
    waitingCount: 8,
    metroStatus: 'fluido',
    routeIndex: 6,
  },
  {
    id: 'stop-altamira',
    slug: 'altamira',
    name: 'Altamira',
    zone: 'Plaza Francia · Av. Fco. de Miranda',
    lat: 10.4961,
    lng: -66.8489,
    transportTypes: ['camioneta', 'metro', 'metrobus'],
    waitingCount: 11,
    metroStatus: 'fluido',
    routeIndex: 8,
  },
  {
    id: 'stop-miranda',
    slug: 'parque-del-este',
    name: 'Parque Cristal',
    zone: 'Los Palos Grandes · Parque del Este',
    lat: 10.4966,
    lng: -66.8421,
    transportTypes: ['camioneta', 'metro'],
    waitingCount: 6,
    metroStatus: 'fluido',
    routeIndex: 9,
  },
  {
    id: 'stop-los-cortijos',
    slug: 'los-cortijos',
    name: 'Los Cortijos',
    zone: 'Av. Principal · Zona Empresarial',
    lat: 10.4934,
    lng: -66.8245,
    transportTypes: ['camioneta', 'metro', 'metrobus'],
    waitingCount: 15,
    metroStatus: 'fluido',
    routeIndex: 12,
  },
  {
    id: 'stop-la-california',
    slug: 'la-california',
    name: 'La California',
    zone: 'C.C. Líder · Av. Fco. de Miranda',
    lat: 10.4892,
    lng: -66.8172,
    transportTypes: ['camioneta', 'metro', 'metrobus'],
    waitingCount: 12,
    metroStatus: 'fluido',
    routeIndex: 13,
  },
  {
    id: 'stop-petare',
    slug: 'petare',
    name: 'Petare',
    zone: 'Redoma de Petare · Terminal Este',
    lat: 10.4789,
    lng: -66.8058,
    transportTypes: ['camioneta', 'metro'],
    waitingCount: 24,
    metroStatus: 'retraso',
    routeIndex: 15,
  },
];

export const INITIAL_UNITS: ActiveUnit[] = [
  {
    id: 'unit-01',
    unitCode: 'UNIDAD-01',
    plate: 'AB-412-VE',
    driverName: 'Roberto Herrera',
    routeName: 'Corredor Miranda · Plz. Vzla ↔ Petare',
    transportType: 'camioneta',
    lat: 10.4919,
    lng: -66.8615,
    speedKmh: 26,
    occupancy: 'libre',
    isActive: true,
    direction: 1,
    routeProgress: 0.31,
    pagoMovil: {
      bank: 'Banesco (0134)',
      phone: '0412-555-0194',
      idNumber: 'V-19.482.310',
      fareBs: 25,
    },
  },
  {
    id: 'unit-07',
    unitCode: 'UNIDAD-07',
    plate: 'CD-889-CS',
    driverName: 'Luis Rodríguez',
    routeName: 'Chacaíto ↔ Petare Directo',
    transportType: 'camioneta',
    lat: 10.4959,
    lng: -66.8364,
    speedKmh: 21,
    occupancy: 'de_pie',
    isActive: true,
    direction: -1,
    routeProgress: 0.67,
    pagoMovil: {
      bank: 'Mercantil (0105)',
      phone: '0414-301-8842',
      idNumber: 'V-15.203.991',
      fareBs: 25,
    },
  },
  {
    id: 'unit-mb-402',
    unitCode: 'MB-402',
    plate: 'EF-104-MR',
    driverName: 'José Gregorio Pérez',
    routeName: 'Metrobús 221 · Plz. Vzla ↔ La California',
    transportType: 'metrobus',
    lat: 10.4939,
    lng: -66.8781,
    speedKmh: 24,
    occupancy: 'full',
    isActive: true,
    direction: 1,
    routeProgress: 0.14,
    pagoMovil: {
      bank: 'BDV (0102)',
      phone: '0416-712-3309',
      idNumber: 'J-20001234-5',
      fareBs: 15,
    },
  },
];

export const INITIAL_ROAD_ALERTS: RoadAlert[] = [
  {
    id: 'alert-init-1',
    type: 'traffic',
    label: 'Tráfico lento altura Distribuidor Altamira',
    stopName: 'Altamira',
    timeAgo: 'Hace 4 min',
    reporter: 'AB-412-VE',
  },
];

export const INITIAL_MERCHANTS: Merchant[] = [
  {
    id: 'merchant-cafe-chacaito',
    name: 'Café & Cachitos El Bulevar',
    category: 'cafe',
    emoji: '☕',
    stopId: 'stop-chacaito',
    lat: 10.4914,
    lng: -66.8681,
    referenceStop: 'A 30m de Metro Chacaíto',
    offerTitle: 'Café Marrón + Cachito (-50%)',
    offerDescription:
      'Muestra el boleto activo en barra para recibir 50% de descuento en combo mañanero.',
    pointsCost: 25,
    imageUrl: '/src/assets/images/merchant_cafe_chacaito_1795711630856.jpg',
  },
  {
    id: 'merchant-arepas-altamira',
    name: 'Arepera Express Plaza Francia',
    category: 'comida',
    emoji: '🍔',
    stopId: 'stop-altamira',
    lat: 10.4969,
    lng: -66.8495,
    referenceStop: 'A 25m de Metro Altamira',
    offerTitle: '2 Empanadas + Malta Fría',
    offerDescription:
      'Canje directo sin fila en barra rápida presentando tu código de 6 dígitos.',
    pointsCost: 35,
    imageUrl: '/src/assets/images/merchant_arepas_altamira_1795711631736.jpg',
  },
  {
    id: 'merchant-saldo-plaza',
    name: 'Kiosco Conecta Previsora',
    category: 'saldo',
    emoji: '📱',
    stopId: 'stop-plaza-vzla',
    lat: 10.497,
    lng: -66.8848,
    referenceStop: 'A 20m de Plaza Venezuela',
    offerTitle: 'Recarga 1 GB Digitel / Movistar',
    offerDescription:
      'Acreditación instantánea de paquete de navegación al validar el código en caja.',
    pointsCost: 40,
    imageUrl: '/src/assets/images/merchant_saldo_plaza_vzla_1795711633248.jpg',
  },
  {
    id: 'merchant-panaderia-cortijos',
    name: 'Panadería La Esquina Cortijos',
    category: 'cafe',
    emoji: '🥐',
    stopId: 'stop-los-cortijos',
    lat: 10.4945,
    lng: -66.8226,
    referenceStop: 'A 40m de Metro Los Cortijos',
    offerTitle: 'Golfeado con Queso de Mano',
    offerDescription:
      'Golfeado recién salido del horno con queso de mano o café guayoyo grande.',
    pointsCost: 30,
    imageUrl: '/src/assets/images/merchant_panaderia_cortijos_1795711633123.jpg',
  },
];

export const FARE_RATES = {
  bcvRateBsPerUsd: 52.4,
  fares: [
    {
      id: 'camioneta' as const,
      label: 'Camioneta Urbana',
      fareBs: 25,
      color: '#10B981',
      note: 'Efectivo o Pago Móvil al colector',
    },
    {
      id: 'metro' as const,
      label: 'Metro de Caracas',
      fareBs: 15,
      color: '#F97316',
      note: 'Tarjeta SUVE recargable',
    },
    {
      id: 'metrobus' as const,
      label: 'Metrobús',
      fareBs: 15,
      color: '#3B82F6',
      note: 'Tarjeta SUVE integrada',
    },
  ],
};
