import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, AlertTriangle } from 'lucide-react';
import {
  DayGroup,
  ItineraryItem,
  TripLogisticsSummary,
  ViewMode,
} from './types';
import {
  isValidLatLng,
  parseWorkbookBuffer,
  recomputeDistances,
} from './utils/excelParser';
import { getDayColor } from './utils/colors';
import { geocodeItem, getCachedCoord } from './utils/geocoder';
import { Header } from './components/Header';
import { DayFilterBar } from './components/DayFilterBar';
import { TimelineView } from './components/TimelineView';
import { MapView } from './components/MapView';
import { PlaceDetailCard } from './components/PlaceDetailCard';
import { LogisticsModal } from './components/LogisticsModal';

export function App() {
  const [fileName, setFileName] = useState<string>('yunnan-trip.xlsx');
  const [workbookBuffer, setWorkbookBuffer] = useState<ArrayBuffer | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [logistics, setLogistics] = useState<TripLogisticsSummary | undefined>(
    undefined
  );
  const [showLogisticsModal, setShowLogisticsModal] = useState<boolean>(false);
  const [isCustomFile, setIsCustomFile] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const geocodeRunIdRef = useRef<number>(0);

  const applyParsedBuffer = (
    buffer: ArrayBuffer,
    name: string,
    custom: boolean,
    sheet?: string
  ) => {
    try {
      setErrorMsg(null);
      const parsed = parseWorkbookBuffer(buffer, name, sheet);
      if (parsed.items.length === 0) {
        setErrorMsg(
          `No itinerary rows found in "${name}". Make sure your sheet has columns like Day, Time, Place, Address, or Activity.`
        );
      }

      const hydrated = parsed.items.map((item) => {
        if (item.geocodeStatus === 'resolved') return item;
        const cached = getCachedCoord(item);
        if (cached) {
          return {
            ...item,
            lat: cached.lat,
            lng: cached.lng,
            geocodeStatus: 'resolved' as const,
            geocodeSource: 'geocoded' as const,
          };
        }
        return item;
      });

      setWorkbookBuffer(buffer);
      setFileName(name);
      setSheetNames(parsed.sheetNames);
      setActiveSheet(parsed.activeSheet);
      setItems(recomputeDistances(hydrated));
      setLogistics(parsed.logistics);
      setIsCustomFile(custom);
      setSelectedDay('ALL');
      setSelectedCategory('ALL');
      setSearchQuery('');
      setSelectedItemId(null);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `Could not parse Excel file: ${err.message}`
          : 'Could not parse Excel file.'
      );
    }
  };

  const loadDefaultItinerary = async () => {
    try {
      const res = await fetch('/yunnan-trip.xlsx');
      if (!res.ok) throw new Error('Failed to load yunnan-trip.xlsx');
      const buffer = await res.arrayBuffer();
      applyParsedBuffer(buffer, 'yunnan-trip.xlsx', false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to load default itinerary.'
      );
    }
  };

  // Load Yunnan itinerary on startup
  useEffect(() => {
    loadDefaultItinerary();
  }, []);

  // Background auto-geocoding for any uploaded items without explicit coordinates
  useEffect(() => {
    const pendingItems = items.filter((i) => i.geocodeStatus === 'pending');
    if (pendingItems.length === 0) return;

    const currentRunId = ++geocodeRunIdRef.current;
    let cancelled = false;

    const runQueue = async () => {
      for (const pending of pendingItems) {
        if (cancelled || geocodeRunIdRef.current !== currentRunId) return;

        setItems((prev) =>
          prev.map((it) =>
            it.id === pending.id ? { ...it, geocodeStatus: 'searching' } : it
          )
        );

        const coord = await geocodeItem(pending);
        if (cancelled || geocodeRunIdRef.current !== currentRunId) return;

        setItems((prev) => {
          const next = prev.map((it) =>
            it.id === pending.id
              ? coord
                ? {
                    ...it,
                    lat: coord.lat,
                    lng: coord.lng,
                    geocodeStatus: 'resolved' as const,
                    geocodeSource: 'geocoded' as const,
                  }
                : { ...it, geocodeStatus: 'not_found' as const }
              : it
          );
          return recomputeDistances(next);
        });

        await new Promise((r) => setTimeout(r, 350));
      }
    };

    runQueue();

    return () => {
      cancelled = true;
    };
  }, [fileName, activeSheet, items.length]);

  const handleFileUpload = async (file: File) => {
    const buffer = await file.arrayBuffer();
    applyParsedBuffer(buffer, file.name, true);
  };

  const handleSelectSheet = (sheet: string) => {
    if (!workbookBuffer) return;
    applyParsedBuffer(workbookBuffer, fileName, isCustomFile, sheet);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category) set.add(item.category);
    }
    return Array.from(set);
  }, [items]);

  const allDayGroups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, ItineraryItem[]>();
    for (const item of items) {
      const list = map.get(item.day) || [];
      list.push(item);
      map.set(item.day, list);
    }

    const groups: DayGroup[] = [];
    for (const [day, dayItems] of map.entries()) {
      const dayNumber = dayItems[0]?.dayNumber ?? groups.length + 1;
      const date = dayItems.find((i) => i.date)?.date;
      groups.push({
        day,
        dayNumber,
        date,
        color: getDayColor(dayNumber),
        items: dayItems,
      });
    }
    return groups;
  }, [items]);

  const filteredDayGroups = useMemo<DayGroup[]>(() => {
    const q = searchQuery.trim().toLowerCase();

    return allDayGroups
      .filter((group) => selectedDay === 'ALL' || group.day === selectedDay)
      .map((group) => {
        const filteredItems = group.items.filter((item) => {
          if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
            return false;
          }
          if (!q) return true;
          const haystack = [
            item.place,
            item.chineseName,
            item.address,
            item.activity,
            item.logisticsNotes,
            item.category,
            item.time,
            item.cost,
            item.booking,
            item.day,
            item.altitude,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        });
        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [allDayGroups, selectedDay, selectedCategory, searchQuery]);

  const allVisibleItems = useMemo(
    () => filteredDayGroups.flatMap((g) => g.items),
    [filteredDayGroups]
  );

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const mappedStopsCount = useMemo(
    () => items.filter((i) => isValidLatLng(i.lat, i.lng)).length,
    [items]
  );

  const geocodingCount = useMemo(
    () =>
      items.filter(
        (i) => i.geocodeStatus === 'pending' || i.geocodeStatus === 'searching'
      ).length,
    [items]
  );

  const selectedVisibleIdx = selectedItem
    ? allVisibleItems.findIndex((i) => i.id === selectedItem.id)
    : -1;
  const hasPrev = selectedVisibleIdx > 0;
  const hasNext =
    selectedVisibleIdx >= 0 && selectedVisibleIdx < allVisibleItems.length - 1;
  const prevItemInDay =
    selectedItem &&
    selectedVisibleIdx > 0 &&
    allVisibleItems[selectedVisibleIdx - 1]?.day === selectedItem.day
      ? allVisibleItems[selectedVisibleIdx - 1]
      : undefined;

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop File Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-[1000] bg-indigo-950/60 backdrop-blur-xs flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-2 border-dashed border-indigo-500 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Drop your Excel Itinerary here
            </h2>
            <p className="text-xs text-slate-500">
              Supports .xlsx, .xls, and .csv files. Places will be plotted on the map and organized into your timeline automatically.
            </p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        fileName={fileName}
        sheetNames={sheetNames}
        activeSheet={activeSheet}
        onSelectSheet={handleSelectSheet}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalDays={allDayGroups.length}
        totalStops={items.length}
        mappedStops={mappedStopsCount}
        geocodingCount={geocodingCount}
        onFileUpload={handleFileUpload}
        onResetSample={loadDefaultItinerary}
        isCustomFile={isCustomFile}
        hasLogistics={Boolean(logistics)}
        onOpenLogistics={() => setShowLogisticsModal(true)}
      />

      {/* Day & Search Filter Bar */}
      <DayFilterBar
        dayGroups={allDayGroups}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-amber-700 font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 min-h-0 flex relative overflow-hidden">
        {viewMode === 'split' && (
          <div className="flex flex-col-reverse md:flex-row w-full h-full overflow-hidden">
            <div className="w-full md:w-[440px] lg:w-[510px] xl:w-[560px] h-[55%] md:h-full border-t md:border-t-0 md:border-r border-slate-200 bg-slate-50/60 shrink-0 overflow-hidden">
              <TimelineView
                dayGroups={filteredDayGroups}
                selectedItemId={selectedItemId}
                onSelectItem={(item) => setSelectedItemId(item.id)}
              />
            </div>
            <div className="w-full h-[45%] md:h-full md:flex-1 overflow-hidden">
              <MapView
                dayGroups={filteredDayGroups}
                selectedItem={selectedItem}
                onSelectItem={(item) => setSelectedItemId(item ? item.id : null)}
                allVisibleItems={allVisibleItems}
              />
            </div>
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="w-full h-full overflow-hidden relative">
            <TimelineView
              dayGroups={filteredDayGroups}
              selectedItemId={selectedItemId}
              onSelectItem={(item) => setSelectedItemId(item.id)}
              isFullWidth
            />

            {selectedItem && (
              <div
                className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-3 sm:p-4"
                onClick={() => setSelectedItemId(null)}
              >
                <div
                  className="w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PlaceDetailCard
                    item={selectedItem}
                    prevItemInDay={prevItemInDay}
                    onClose={() => setSelectedItemId(null)}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    onPrev={() => {
                      if (hasPrev)
                        setSelectedItemId(
                          allVisibleItems[selectedVisibleIdx - 1].id
                        );
                    }}
                    onNext={() => {
                      if (hasNext)
                        setSelectedItemId(
                          allVisibleItems[selectedVisibleIdx + 1].id
                        );
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="w-full h-full overflow-hidden">
            <MapView
              dayGroups={filteredDayGroups}
              selectedItem={selectedItem}
              onSelectItem={(item) => setSelectedItemId(item ? item.id : null)}
              allVisibleItems={allVisibleItems}
            />
          </div>
        )}
      </main>

      {/* Hotels & Transport Tracker Modal */}
      {showLogisticsModal && logistics && (
        <LogisticsModal
          logistics={logistics}
          onClose={() => setShowLogisticsModal(false)}
        />
      )}
    </div>
  );
}
export default App;
