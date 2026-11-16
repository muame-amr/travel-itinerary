import { ItineraryItem } from '../types';
import { isValidLatLng } from './excelParser';

const CACHE_KEY = 'travel_itinerary_geocode_cache_v1';

interface CachedCoord {
  lat: number;
  lng: number;
}

function loadCache(): Record<string, CachedCoord> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveToCache(query: string, coord: CachedCoord) {
  try {
    const cache = loadCache();
    cache[query.toLowerCase().trim()] = coord;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

export function getCachedCoord(item: ItineraryItem): CachedCoord | null {
  const cache = loadCache();
  const queries = buildQueries(item);
  for (const q of queries) {
    const hit = cache[q.toLowerCase().trim()];
    if (hit && isValidLatLng(hit.lat, hit.lng)) {
      return hit;
    }
  }
  return null;
}

function buildQueries(item: ItineraryItem): string[] {
  const queries: string[] = [];
  if (item.place && item.address && item.place !== item.address) {
    queries.push(`${item.place}, ${item.address}`);
  }
  if (item.address) {
    queries.push(item.address);
  }
  if (item.place) {
    queries.push(item.place);
  }
  return Array.from(new Set(queries.map((q) => q.trim()).filter(Boolean)));
}

async function queryPhoton(q: string): Promise<CachedCoord | null> {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    const coords = feature?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function queryNominatim(q: string): Promise<CachedCoord | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function geocodeItem(item: ItineraryItem): Promise<CachedCoord | null> {
  const cached = getCachedCoord(item);
  if (cached) return cached;

  const queries = buildQueries(item);
  for (const q of queries) {
    const photonHit = await queryPhoton(q);
    if (photonHit) {
      saveToCache(q, photonHit);
      return photonHit;
    }
    const nominatimHit = await queryNominatim(q);
    if (nominatimHit) {
      saveToCache(q, nominatimHit);
      return nominatimHit;
    }
  }
  return null;
}
