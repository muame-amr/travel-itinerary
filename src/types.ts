export type ViewMode = 'split' | 'timeline' | 'map';

export interface ItineraryItem {
  id: string;
  rowIndex: number;
  day: string;
  dayNumber: number;
  stopOrderInDay: number;
  date?: string;
  time?: string;
  place: string;
  chineseName?: string;
  address?: string;
  category?: string;
  altitude?: string;
  weather?: string;
  activity?: string;
  logisticsNotes?: string;
  cost?: string;
  booking?: string;
  link?: string;
  lat?: number;
  lng?: number;
  geocodeStatus: 'resolved' | 'pending' | 'searching' | 'not_found';
  geocodeSource?: 'excel' | 'url' | 'geocoded';
  distanceFromPrevKm?: number;
  extraFields: Record<string, string>;
}

export interface DayGroup {
  day: string;
  dayNumber: number;
  date?: string;
  routeSummary?: string;
  weatherSummary?: string;
  color: string;
  items: ItineraryItem[];
}

export interface HotelBookingInfo {
  staySegment: string;
  dates: string;
  cityArea: string;
  hotelName: string;
  address: string;
  contact: string;
  roomType: string;
  bookingStatus: string;
  notes: string;
  price: string;
  link?: string;
}

export interface TransportLegInfo {
  leg: string;
  dateAndType: string;
  route: string;
  carrier: string;
  departure: string;
  arrival: string;
  passengers: string;
  bookingRef: string;
  notes: string;
  price: string;
  link?: string;
}

export interface TripLogisticsSummary {
  title: string;
  subtitle: string;
  duration: string;
  travelers: string;
  hotelsTotal: string;
  trainsTotal: string;
  hotels: HotelBookingInfo[];
  transportLegs: TransportLegInfo[];
}

export interface ParsedWorkbookResult {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  items: ItineraryItem[];
  logistics?: TripLogisticsSummary;
}
