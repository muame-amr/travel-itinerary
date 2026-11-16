import React, { useState } from 'react';
import {
  X,
  Building2,
  Plane,
  Train,
  Copy,
  Check,
  ExternalLink,
  Users,
  Calendar,
} from 'lucide-react';
import { TripLogisticsSummary } from '../types';

interface LogisticsModalProps {
  logistics: TripLogisticsSummary;
  onClose: () => void;
}

export const LogisticsModal: React.FC<LogisticsModalProps> = ({
  logistics,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'hotels' | 'transport'>('hotels');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[900] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold">{logistics.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {logistics.duration}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                {logistics.travelers}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('hotels')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'hotels'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Accommodations ({logistics.hotels.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transport')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'transport'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              Flights, Trains & Tour ({logistics.transportLegs.length})
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              Booked Hotels:{' '}
              <strong className="text-slate-900">{logistics.hotelsTotal}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Bullet Trains:{' '}
              <strong className="text-slate-900">{logistics.trainsTotal}</strong>
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 bg-slate-50/50">
          {activeTab === 'hotels' &&
            logistics.hotels.map((hotel, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {hotel.staySegment}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {hotel.cityArea}
                      </span>
                      <span className="text-xs text-slate-400">• {hotel.dates}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {hotel.hotelName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {hotel.price && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {hotel.price}
                      </span>
                    )}
                    {hotel.link && (
                      <a
                        href={hotel.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
                        title="Open Booking Reference"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Address with Copy Button for Taxi / Didi */}
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/70 flex items-start justify-between gap-2 text-xs text-slate-700">
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-800">{hotel.address}</div>
                    {hotel.contact && (
                      <div className="text-slate-500">Contact: {hotel.contact}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(hotel.address, `hotel-${idx}`)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shrink-0 cursor-pointer"
                    title="Copy address for Didi / Taxi"
                  >
                    {copiedKey === `hotel-${idx}` ? (
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="font-semibold text-slate-700">Room: </span>
                    {hotel.roomType}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Status: </span>
                    <span className="text-indigo-700 font-medium">
                      {hotel.bookingStatus}
                    </span>
                  </div>
                </div>

                {hotel.notes && (
                  <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                    {hotel.notes}
                  </p>
                )}
              </div>
            ))}

          {activeTab === 'transport' &&
            logistics.transportLegs.map((leg, idx) => {
              const isTrain = leg.dateAndType.toLowerCase().includes('train');
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {isTrain ? (
                            <Train className="w-3 h-3" />
                          ) : (
                            <Plane className="w-3 h-3" />
                          )}
                          {leg.leg}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {leg.dateAndType}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {leg.route} —{' '}
                        <span className="text-indigo-600">{leg.carrier}</span>
                      </h3>
                    </div>

                    {leg.price && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {leg.price}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Departure: </span>
                      <strong className="text-slate-800">{leg.departure}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Arrival: </span>
                      <strong className="text-slate-800">{leg.arrival}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700">Booking Ref: </span>
                      <span className="text-indigo-700 font-medium">
                        {leg.bookingRef}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Passengers: </span>
                      {leg.passengers}
                    </div>
                  </div>

                  {leg.notes && (
                    <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                      {leg.notes}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
