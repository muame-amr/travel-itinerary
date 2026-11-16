import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  MapPin,
  Wallet,
  Ticket,
  ExternalLink,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Route,
  Globe,
  Mountain,
  Info,
  Copy,
  Check,
  CloudSun,
} from 'lucide-react';
import { ItineraryItem } from '../types';
import { getCategoryStyle, getDayColor } from '../utils/colors';

interface PlaceDetailCardProps {
  item: ItineraryItem;
  prevItemInDay?: ItineraryItem;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const PlaceDetailCard: React.FC<PlaceDetailCardProps> = ({
  item,
  prevItemInDay,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  const [copied, setCopied] = useState(false);
  const dayColor = getDayColor(item.dayNumber);
  const catStyle = getCategoryStyle(item.category);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${item.place} ${item.chineseName || ''} ${item.address || ''}`.trim()
  )}`;

  const directionsUrl =
    prevItemInDay &&
    prevItemInDay.lat !== undefined &&
    prevItemInDay.lng !== undefined &&
    item.lat !== undefined &&
    item.lng !== undefined
      ? `https://www.google.com/maps/dir/?api=1&origin=${prevItemInDay.lat},${prevItemInDay.lng}&destination=${item.lat},${item.lng}`
      : null;

  const isExternalWebsite =
    item.link &&
    !item.link.includes('google.com/maps') &&
    !item.link.includes('goo.gl/maps');

  const handleCopyLocation = () => {
    const textToCopy = item.chineseName
      ? `${item.chineseName} (${item.address || item.place})`
      : `${item.place} - ${item.address || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[82vh] w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Top Color Header Bar */}
      <div
        className="px-4 py-3 text-white flex items-center justify-between gap-2 shrink-0"
        style={{ backgroundColor: dayColor }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-xs text-white font-bold text-xs flex items-center justify-center shrink-0">
            {item.stopOrderInDay}
          </span>
          <span className="font-semibold text-xs tracking-wide uppercase truncate">
            {item.day}
            {item.date ? ` • ${item.date}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="p-1 rounded-lg hover:bg-white/20 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Previous place"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="p-1 rounded-lg hover:bg-white/20 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Next place"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/25 mx-0.5" />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 overflow-y-auto space-y-3 text-sm">
        {/* Time, Category, Altitude, Distance Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {item.time && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {item.time}
            </span>
          )}
          {item.category && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
            >
              {catStyle.label}
            </span>
          )}
          {item.altitude && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <Mountain className="w-3.5 h-3.5" />
              {item.altitude}
            </span>
          )}
          {item.distanceFromPrevKm !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Route className="w-3 h-3" />
              {item.distanceFromPrevKm} km
            </span>
          )}
        </div>

        {/* Title, Chinese Name & Address */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {item.place}
          </h3>
          {item.chineseName && (
            <div className="mt-1 flex items-center justify-between gap-2 bg-indigo-50/70 border border-indigo-100 px-2.5 py-1.5 rounded-lg">
              <span className="text-xs font-semibold text-indigo-900">
                {item.chineseName}
              </span>
              <button
                type="button"
                onClick={handleCopyLocation}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shrink-0 cursor-pointer"
                title="Copy Chinese name & address for Didi / Taxi"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
          {item.address && (
            <p className="mt-1.5 text-xs text-slate-500 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{item.address}</span>
            </p>
          )}
        </div>

        {/* Activity / Description */}
        {item.activity && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {item.activity}
          </div>
        )}

        {/* Practical & Logistics Notes */}
        {item.logisticsNotes && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-900 mb-0.5">
                Logistics & Practical Note
              </span>
              {item.logisticsNotes}
            </div>
          </div>
        )}

        {/* Cost & Booking Info Grid */}
        {(item.cost || item.booking) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.cost && (
              <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2.5">
                <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  Cost / Price
                </div>
                <div className="text-xs font-bold text-emerald-950 mt-0.5">
                  {item.cost}
                </div>
              </div>
            )}
            {item.booking && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Ticket className="w-3 h-3" />
                  Booking / Status
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">
                  {item.booking}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weather for the day */}
        {item.weather && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-600 flex items-start gap-2">
            <CloudSun className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">Expected Weather: </span>
              {item.weather}
            </div>
          </div>
        )}

        {/* Coordinates footer info */}
        {item.lat !== undefined && item.lng !== undefined && (
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>
              Coordinates: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
            </span>
            {item.date && <span>{item.date}</span>}
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center gap-2 shrink-0">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Google Maps
        </a>

        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            title={`Directions from ${prevItemInDay?.place}`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </a>
        )}

        {isExternalWebsite && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            Reference Link
          </a>
        )}
      </div>
    </div>
  );
};
