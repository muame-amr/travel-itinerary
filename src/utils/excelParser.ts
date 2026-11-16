import * as XLSX from 'xlsx';
import { ItineraryItem, ParsedWorkbookResult } from '../types';
import { isYunnanTripWorkbook, parseYunnanWorkbook } from './yunnanExtractor';

const IGNORED_HEADER_KEYWORDS = [
  'outfit',
  'footwear',
  'shopee',
  'tiktok',
  'Recommended Size',
  'Travel Light Qty',
  'Buying & Sizing',
];

const HEADER_ALIASES: Record<string, string[]> = {
  day: ['day', 'day #', 'day number', 'day_num', 'day no', 'trip day'],
  date: ['date', 'travel date', 'full date', 'day date'],
  time: ['time', 'start time', 'schedule', 'hour', 'arrival', 'time slot'],
  place: [
    'place',
    'location',
    'locations & altitude',
    'destination',
    'spot',
    'name',
    'title',
    'poi',
    'site',
    'venue',
    'attraction',
    'hotel name',
  ],
  address: ['address', 'full address', 'street', 'area', 'city', 'neighborhood', 'district'],
  category: ['category', 'type', 'tag', 'kind', 'activity type', 'group'],
  activity: [
    'activity',
    'planned itinerary & activities',
    'notes',
    'description',
    'details',
    'plan',
    'remarks',
    'memo',
    'comment',
    'summary',
    'what to do',
  ],
  logisticsNotes: ['practical & logistics notes', 'logistics', 'practical notes'],
  weather: ['expected temp & weather', 'weather', 'temp', 'temperature'],
  cost: ['cost', 'price', 'budget', 'expense', 'fee', 'ticket', 'amount', 'total price'],
  booking: ['booking', 'reservation', 'status', 'ref', 'confirmation', 'ticket status'],
  link: [
    'link',
    'url',
    'website',
    'map',
    'google maps',
    'map link',
    'maps url',
    'href',
    'weather / destination reference url',
  ],
  lat: ['lat', 'latitude', 'y'],
  lng: ['lng', 'lon', 'long', 'longitude', 'x'],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function isIgnoredHeader(header: string): boolean {
  const norm = normalizeHeader(header);
  return IGNORED_HEADER_KEYWORDS.some((kw) => norm.includes(kw.toLowerCase()));
}

function matchFieldKey(header: string): string | null {
  const norm = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(norm)) return field;
  }
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => norm.length > 2 && norm.includes(alias))) {
      return field;
    }
  }
  return null;
}

export function extractCoordsFromText(text?: string): { lat: number; lng: number } | null {
  if (!text) return null;
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&](?:q|ll|query|center)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/i,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /^\s*(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})\s*$/,
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }
  }
  return null;
}

export function isValidLatLng(lat?: number, lng?: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);
}

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function recomputeDistances(items: ItineraryItem[]): ItineraryItem[] {
  const byDay = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    const list = byDay.get(item.day) || [];
    list.push(item);
    byDay.set(item.day, list);
  }

  const updatedMap = new Map<string, number | undefined>();
  for (const [, dayItems] of byDay.entries()) {
    let prevMapped: ItineraryItem | null = null;
    for (const item of dayItems) {
      if (isValidLatLng(item.lat, item.lng)) {
        if (prevMapped && isValidLatLng(prevMapped.lat, prevMapped.lng)) {
          const dist = calculateDistanceKm(
            prevMapped.lat!,
            prevMapped.lng!,
            item.lat!,
            item.lng!
          );
          updatedMap.set(item.id, dist);
        } else {
          updatedMap.set(item.id, undefined);
        }
        prevMapped = item;
      }
    }
  }

  return items.map((item) => ({
    ...item,
    distanceFromPrevKm: updatedMap.get(item.id),
  }));
}

function parseDayLabel(rawDay: string | undefined, fallbackDayIndex: number): {
  day: string;
  dayNumber: number;
} {
  if (!rawDay || !rawDay.trim()) {
    return {
      day: `Day ${fallbackDayIndex}`,
      dayNumber: fallbackDayIndex,
    };
  }
  const clean = rawDay.trim();
  const numMatch = clean.match(/(\d+)/);
  if (/^\d+$/.test(clean)) {
    const n = parseInt(clean, 10);
    return { day: `Day ${n}`, dayNumber: n };
  }
  if (numMatch) {
    return { day: clean, dayNumber: parseInt(numMatch[1], 10) };
  }
  return { day: clean, dayNumber: fallbackDayIndex };
}

export function parseWorkbookBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  preferredSheet?: string
): ParsedWorkbookResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) {
    return { fileName, sheetNames: [], activeSheet: '', items: [] };
  }

  // If this is the Yunnan trip workbook, extract only the relevant itinerary, hotel, and transport info
  if (isYunnanTripWorkbook(workbook)) {
    return parseYunnanWorkbook(workbook, fileName);
  }

  const activeSheet =
    preferredSheet && sheetNames.includes(preferredSheet)
      ? preferredSheet
      : sheetNames[0];

  const worksheet = workbook.Sheets[activeSheet];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });

  const dayNumbersSeen = new Map<string, number>();
  let nextDayNum = 1;
  let lastSeenDay = 'Day 1';
  let lastSeenDate = '';

  const parsedItems: ItineraryItem[] = [];

  rawRows.forEach((row, index) => {
    const mapped: Record<string, string> = {};
    const extraFields: Record<string, string> = {};

    for (const [rawKey, rawVal] of Object.entries(row)) {
      if (!rawKey || rawKey.startsWith('__EMPTY')) continue;
      if (isIgnoredHeader(rawKey)) continue;
      const val = String(rawVal ?? '').trim();
      if (!val) continue;

      const matchedKey = matchFieldKey(rawKey);
      if (matchedKey && !mapped[matchedKey]) {
        mapped[matchedKey] = val;
      } else if (matchedKey && mapped[matchedKey]) {
        if (matchedKey === 'activity' || matchedKey === 'address') {
          mapped[matchedKey] = `${mapped[matchedKey]} — ${val}`;
        } else {
          extraFields[rawKey.trim()] = val;
        }
      } else {
        extraFields[rawKey.trim()] = val;
      }
    }

    const place =
      mapped.place ||
      mapped.address ||
      mapped.activity ||
      Object.values(extraFields)[0] ||
      '';

    if (!place) {
      return;
    }

    const rawDayInput = mapped.day || lastSeenDay;
    const { day, dayNumber: extractedDayNum } = parseDayLabel(rawDayInput, nextDayNum);

    if (!dayNumbersSeen.has(day)) {
      dayNumbersSeen.set(day, extractedDayNum || nextDayNum);
      nextDayNum = Math.max(nextDayNum + 1, (extractedDayNum || nextDayNum) + 1);
    }
    const dayNumber = dayNumbersSeen.get(day)!;
    lastSeenDay = day;

    if (mapped.date) {
      lastSeenDate = mapped.date;
    }
    const date = mapped.date || lastSeenDate || undefined;

    let lat: number | undefined;
    let lng: number | undefined;
    let geocodeSource: 'excel' | 'url' | 'geocoded' | undefined;

    if (mapped.lat && mapped.lng) {
      const parsedLat = parseFloat(mapped.lat);
      const parsedLng = parseFloat(mapped.lng);
      if (isValidLatLng(parsedLat, parsedLng)) {
        lat = parsedLat;
        lng = parsedLng;
        geocodeSource = 'excel';
      }
    }

    if (!isValidLatLng(lat, lng)) {
      const fromUrl =
        extractCoordsFromText(mapped.link) ||
        extractCoordsFromText(mapped.address) ||
        extractCoordsFromText(mapped.place);
      if (fromUrl) {
        lat = fromUrl.lat;
        lng = fromUrl.lng;
        geocodeSource = 'url';
      }
    }

    const hasCoords = isValidLatLng(lat, lng);

    parsedItems.push({
      id: `item-${index + 1}`,
      rowIndex: index + 1,
      day,
      dayNumber,
      stopOrderInDay: 1,
      date,
      time: mapped.time || undefined,
      place,
      address: mapped.address || undefined,
      category: mapped.category || undefined,
      weather: mapped.weather || undefined,
      activity: mapped.activity || undefined,
      logisticsNotes: mapped.logisticsNotes || undefined,
      cost: mapped.cost || undefined,
      booking: mapped.booking || undefined,
      link: mapped.link || undefined,
      lat: hasCoords ? lat : undefined,
      lng: hasCoords ? lng : undefined,
      geocodeStatus: hasCoords ? 'resolved' : 'pending',
      geocodeSource,
      extraFields,
    });
  });

  const dayCounters = new Map<string, number>();
  const orderedItems = parsedItems.map((item) => {
    const count = (dayCounters.get(item.day) || 0) + 1;
    dayCounters.set(item.day, count);
    return {
      ...item,
      stopOrderInDay: count,
    };
  });

  return {
    fileName,
    sheetNames,
    activeSheet,
    items: recomputeDistances(orderedItems),
  };
}
