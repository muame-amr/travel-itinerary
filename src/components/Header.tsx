import React, { useRef } from 'react';
import {
  MapPin,
  Columns2,
  ListOrdered,
  Map as MapIcon,
  Upload,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Briefcase,
} from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  onSelectSheet: (sheet: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalDays: number;
  totalStops: number;
  mappedStops: number;
  geocodingCount: number;
  onFileUpload: (file: File) => void;
  onResetSample: () => void;
  isCustomFile: boolean;
  hasLogistics: boolean;
  onOpenLogistics: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  sheetNames,
  activeSheet,
  onSelectSheet,
  viewMode,
  onViewModeChange,
  totalDays,
  totalStops,
  mappedStops,
  geocodingCount,
  onFileUpload,
  onResetSample,
  isCustomFile,
  hasLogistics,
  onOpenLogistics,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  const isYunnanDefault = fileName.toLowerCase().includes('yunnan');
  const displayTitle = isYunnanDefault
    ? 'Yunnan & Hangzhou Itinerary (Nov 6–15, 2026)'
    : fileName
    ? fileName.replace(/\.(xlsx|xls|csv)$/i, '').replace(/[-_]+/g, ' ')
    : 'Travel Itinerary';

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0 shadow-xs">
      {/* Left: Brand & Active Excel Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {displayTitle}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              {fileName}
            </span>
            {sheetNames.length > 1 && (
              <select
                value={activeSheet}
                onChange={(e) => onSelectSheet(e.target.value)}
                className="text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Switch Excel worksheet"
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    Sheet: {s}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
            <span>
              <strong className="text-slate-700 font-semibold">{totalDays}</strong>{' '}
              {totalDays === 1 ? 'Day' : 'Days'}
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-700 font-semibold">{totalStops}</strong>{' '}
              {totalStops === 1 ? 'Stop' : 'Stops'}
            </span>
            <span>•</span>
            <span>
              <strong className="text-emerald-700 font-semibold">{mappedStops}</strong>/{totalStops} Mapped
            </span>
            {geocodingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Locating {geocodingCount}...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: View Mode Switcher */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => onViewModeChange('split')}
          className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'split'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Columns2 className="w-3.5 h-3.5" />
          Split View
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('timeline')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'timeline'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          Timeline List
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('map')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'map'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          Map View
        </button>
      </div>

      {/* Right: Bookings Tracker & Excel Upload */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {hasLogistics && (
          <button
            type="button"
            onClick={onOpenLogistics}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            title="View confirmed hotels, Chinese addresses, flights, and bullet train bookings"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Hotels & Transport</span>
          </button>
        )}

        {isCustomFile && (
          <button
            type="button"
            onClick={onResetSample}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Restore Yunnan itinerary"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yunnan Trip</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Excel
        </button>
      </div>
    </header>
  );
};
