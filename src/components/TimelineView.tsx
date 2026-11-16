import React, { useEffect, useRef } from 'react';
import {
  Clock,
  MapPin,
  Wallet,
  Ticket,
  ExternalLink,
  Route,
  AlertCircle,
  Loader2,
  Calendar,
  Mountain,
  CloudSun,
  Info,
} from 'lucide-react';
import { DayGroup, ItineraryItem } from '../types';
import { getCategoryStyle } from '../utils/colors';

interface TimelineViewProps {
  dayGroups: DayGroup[];
  selectedItemId: string | null;
  onSelectItem: (item: ItineraryItem) => void;
  isFullWidth?: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  dayGroups,
  selectedItemId,
  onSelectItem,
  isFullWidth = false,
}) => {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedItemId && cardRefs.current[selectedItemId]) {
      cardRefs.current[selectedItemId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedItemId]);

  if (dayGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
        <MapPin className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          No itinerary stops match your filter
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Try clearing your search or selecting "All Days".
        </p>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-y-auto px-4 sm:px-6 py-5 space-y-8 ${
        isFullWidth ? 'max-w-4xl mx-auto' : ''
      }`}
    >
      {dayGroups.map((group) => {
        const dayWeather = group.items.find((i) => i.weather)?.weather;
        return (
          <section key={group.day} className="space-y-3">
            {/* Sticky Day Header */}
            <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs py-2 border-b border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    {group.day}
                  </h2>
                  {group.date && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white text-slate-600 border border-slate-200">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {group.date}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-500 shrink-0">
                  {group.items.length}{' '}
                  {group.items.length === 1 ? 'stop' : 'stops'}
                </span>
              </div>

              {dayWeather && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-6">
                  <CloudSun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{dayWeather}</span>
                </div>
              )}
            </div>

            {/* Vertical Timeline List */}
            <div className="relative pl-5 sm:pl-6 space-y-3 before:content-[''] before:absolute before:left-[11px] sm:before:left-[13px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
              {group.items.map((item) => {
                const isSelected = selectedItemId === item.id;
                const catStyle = getCategoryStyle(item.category);

                return (
                  <div key={item.id} className="relative">
                    {/* Distance Connector Pill from Previous Stop */}
                    {item.distanceFromPrevKm !== undefined && (
                      <div className="mb-2 -mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pl-1">
                        <Route className="w-3 h-3 text-slate-400" />
                        <span>{item.distanceFromPrevKm} km from previous stop</span>
                      </div>
                    )}

                    {/* Numbered Timeline Dot */}
                    <div
                      className={`absolute -left-5 sm:-left-6 top-3.5 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-xs transition-transform ${
                        isSelected ? 'scale-115 ring-4 ring-indigo-200' : ''
                      }`}
                      style={{ backgroundColor: group.color }}
                    >
                      {item.stopOrderInDay}
                    </div>

                    {/* Timeline Card */}
                    <div
                      ref={(el) => {
                        cardRefs.current[item.id] = el;
                      }}
                      onClick={() => onSelectItem(item)}
                      className={`group rounded-2xl border p-3.5 sm:p-4 transition-all cursor-pointer bg-white ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Top Row: Time + Category + Altitude + Map Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.time && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {item.time}
                            </span>
                          )}
                          {item.category && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                            >
                              {catStyle.label}
                            </span>
                          )}
                          {item.altitude && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              <Mountain className="w-3 h-3" />
                              {item.altitude}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.geocodeStatus === 'searching' && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Locating
                            </span>
                          )}
                          {item.geocodeStatus === 'not_found' && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium"
                              title="Could not resolve coordinates automatically"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Unmapped
                            </span>
                          )}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${item.place} ${item.chineseName || ''} ${item.address || ''}`.trim()
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Open in Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Place Name & Chinese Subtitle */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {item.place}
                      </h3>
                      {item.chineseName && (
                        <p className="text-xs font-medium text-indigo-600/90 mt-0.5">
                          {item.chineseName}
                        </p>
                      )}
                      {item.address && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </p>
                      )}

                      {/* Activity Description */}
                      {item.activity && (
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                          {item.activity}
                        </p>
                      )}

                      {/* Practical / Logistics Tip */}
                      {item.logisticsNotes && (
                        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{item.logisticsNotes}</span>
                        </div>
                      )}

                      {/* Bottom Pills: Cost & Booking */}
                      {(item.cost || item.booking) && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                          {item.cost && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                              <Wallet className="w-3 h-3" />
                              {item.cost}
                            </span>
                          )}
                          {item.booking && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70">
                              <Ticket className="w-3 h-3 text-slate-400" />
                              {item.booking}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
