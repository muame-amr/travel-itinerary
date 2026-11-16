import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Maximize2, Layers } from 'lucide-react';
import { DayGroup, ItineraryItem } from '../types';
import { isValidLatLng } from '../utils/excelParser';
import { PlaceDetailCard } from './PlaceDetailCard';

interface MapViewProps {
  dayGroups: DayGroup[];
  selectedItem: ItineraryItem | null;
  onSelectItem: (item: ItineraryItem | null) => void;
  allVisibleItems: ItineraryItem[];
}

type TileStyle = 'voyager' | 'osm' | 'light';

const TILE_URLS: Record<TileStyle, { url: string; label: string; attribution: string }> = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    label: 'Voyager',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    label: 'Standard',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    label: 'Minimal',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export const MapView: React.FC<MapViewProps> = ({
  dayGroups,
  selectedItem,
  onSelectItem,
  allVisibleItems,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const [tileStyle, setTileStyle] = useState<TileStyle>('voyager');

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [35.6895, 139.6917],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const tileConfig = TILE_URLS[tileStyle];
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

    const routesLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    tileLayerRef.current = tileLayer;
    routesLayerRef.current = routesLayer;
    markersLayerRef.current = markersLayer;

    // Handle container resize cleanly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch tile style
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const cfg = TILE_URLS[tileStyle];
    tileLayerRef.current.setUrl(cfg.url);
  }, [tileStyle]);

  // Render markers and route lines
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const routesLayer = routesLayerRef.current;
    if (!map || !markersLayer || !routesLayer) return;

    markersLayer.clearLayers();
    routesLayer.clearLayers();

    for (const group of dayGroups) {
      const validDayItems = group.items.filter((i) =>
        isValidLatLng(i.lat, i.lng)
      );

      // Draw dashed route polyline connecting stops in this day
      if (validDayItems.length > 1) {
        const latlngs: L.LatLngExpression[] = validDayItems.map((i) => [
          i.lat!,
          i.lng!,
        ]);

        // Subtle white halo line underneath for contrast
        L.polyline(latlngs, {
          color: '#ffffff',
          weight: 6,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routesLayer);

        // Colored dashed route line
        L.polyline(latlngs, {
          color: group.color,
          weight: 3.5,
          opacity: 0.9,
          dashArray: '7, 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routesLayer);
      }

      // Draw numbered markers
      for (const item of validDayItems) {
        const isSelected = selectedItem?.id === item.id;
        const size = isSelected ? 38 : 30;

        const iconHtml = `
          <div style="
            position: relative;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${
              isSelected
                ? `<span style="
                    position: absolute;
                    inset: -6px;
                    border-radius: 9999px;
                    background-color: ${group.color};
                    opacity: 0.28;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></span>`
                : ''
            }
            <div style="
              position: relative;
              width: ${size}px;
              height: ${size}px;
              border-radius: 9999px;
              background-color: ${group.color};
              color: #ffffff;
              font-weight: 700;
              font-size: ${isSelected ? '14px' : '12px'};
              display: flex;
              align-items: center;
              justify-content: center;
              border: ${isSelected ? '3px solid #ffffff' : '2.5px solid #ffffff'};
              box-shadow: 0 4px 10px rgba(15, 23, 42, 0.28);
              transition: transform 0.15s ease;
            ">
              ${item.stopOrderInDay}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-itinerary-marker',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([item.lat!, item.lng!], {
          icon: customIcon,
          zIndexOffset: isSelected ? 1000 : 0,
        });

        const tooltipHtml = `
          <div style="font-family: system-ui, sans-serif; padding: 2px 4px;">
            <div style="font-size: 10px; font-weight: 700; color: ${group.color}; text-transform: uppercase;">
              ${item.day} • Stop #${item.stopOrderInDay}${item.time ? ` • ${item.time}` : ''}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 1px;">
              ${item.place}
            </div>
          </div>
        `;

        marker.bindTooltip(tooltipHtml, {
          direction: 'top',
          offset: [0, -size / 2 - 4],
          opacity: 0.97,
        });

        marker.on('click', () => {
          onSelectItem(item);
        });

        marker.addTo(markersLayer);
      }
    }
  }, [dayGroups, selectedItem, onSelectItem]);

  // Fit bounds when visible day groups change (and no specific item is being focused)
  const fitAllVisible = () => {
    const map = mapRef.current;
    if (!map) return;

    const coords: [number, number][] = [];
    for (const group of dayGroups) {
      for (const item of group.items) {
        if (isValidLatLng(item.lat, item.lng)) {
          coords.push([item.lat!, item.lng!]);
        }
      }
    }

    if (coords.length === 1) {
      map.flyTo(coords[0], 15, { duration: 0.6 });
    } else if (coords.length > 1) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [55, 55], maxZoom: 15 });
    }
  };

  // Auto-fit when day filter or items list changes
  const coordsKey = dayGroups
    .flatMap((g) => g.items.map((i) => `${i.id}:${i.lat ?? ''},${i.lng ?? ''}`))
    .join('|');

  useEffect(() => {
    if (!selectedItem) {
      fitAllVisible();
    }
  }, [coordsKey]);

  // Fly to selected item when user clicks a place
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedItem) return;
    if (isValidLatLng(selectedItem.lat, selectedItem.lng)) {
      const targetZoom = Math.max(map.getZoom(), 14);
      map.flyTo([selectedItem.lat!, selectedItem.lng!], targetZoom, {
        duration: 0.65,
      });
    }
  }, [selectedItem]);

  // Determine previous/next item navigation for the detail card
  const selectedIdx = selectedItem
    ? allVisibleItems.findIndex((i) => i.id === selectedItem.id)
    : -1;
  const hasPrev = selectedIdx > 0;
  const hasNext = selectedIdx >= 0 && selectedIdx < allVisibleItems.length - 1;

  const prevItemInDay =
    selectedItem && selectedIdx > 0 && allVisibleItems[selectedIdx - 1]?.day === selectedItem.day
      ? allVisibleItems[selectedIdx - 1]
      : undefined;

  const cycleTileStyle = () => {
    const order: TileStyle[] = ['voyager', 'osm', 'light'];
    const next = order[(order.indexOf(tileStyle) + 1) % order.length];
    setTileStyle(next);
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top-Left Map Controls: Fit All & Map Style */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={fitAllVisible}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/95 backdrop-blur-xs text-slate-700 hover:text-indigo-600 hover:bg-white shadow-md border border-slate-200/80 transition-all cursor-pointer"
          title="Zoom to fit all visible itinerary pins"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Fit All Pins
        </button>

        <button
          type="button"
          onClick={cycleTileStyle}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/95 backdrop-blur-xs text-slate-700 hover:text-indigo-600 hover:bg-white shadow-md border border-slate-200/80 transition-all cursor-pointer"
          title="Switch map style"
        >
          <Layers className="w-3.5 h-3.5" />
          Map: {TILE_URLS[tileStyle].label}
        </button>
      </div>

      {/* Bottom-Left Day Route Legend (hidden on small screens when detail card is open) */}
      {dayGroups.length > 0 && (
        <div
          className={`absolute bottom-4 left-3 z-[400] bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-md border border-slate-200/80 flex flex-wrap items-center gap-3 max-w-xs sm:max-w-md ${
            selectedItem ? 'hidden xl:flex' : 'flex'
          }`}
        >
          {dayGroups.map((group) => (
            <div key={group.day} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: group.color }}
              />
              <span>{group.day}</span>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Place Card Overlay */}
      {selectedItem && (
        <div className="absolute bottom-4 right-3 left-3 sm:left-auto z-[500] flex justify-end pointer-events-none">
          <div className="pointer-events-auto w-full sm:w-96">
            <PlaceDetailCard
              item={selectedItem}
              prevItemInDay={prevItemInDay}
              onClose={() => onSelectItem(null)}
              hasPrev={hasPrev}
              hasNext={hasNext}
              onPrev={() => {
                if (hasPrev) onSelectItem(allVisibleItems[selectedIdx - 1]);
              }}
              onNext={() => {
                if (hasNext) onSelectItem(allVisibleItems[selectedIdx + 1]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
