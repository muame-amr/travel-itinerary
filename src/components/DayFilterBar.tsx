import React from 'react';
import { Search, X, Calendar, Tag } from 'lucide-react';
import { DayGroup } from '../types';

interface DayFilterBarProps {
  dayGroups: DayGroup[];
  selectedDay: string; // 'ALL' or day label
  onSelectDay: (day: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories: string[];
  selectedCategory: string; // 'ALL' or category
  onSelectCategory: (cat: string) => void;
}

export const DayFilterBar: React.FC<DayFilterBarProps> = ({
  dayGroups,
  selectedDay,
  onSelectDay,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const totalStops = dayGroups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10 shrink-0">
      {/* Day filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar max-w-full">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 mr-1 shrink-0">
          <Calendar className="w-3.5 h-3.5" />
        </span>
        <button
          type="button"
          onClick={() => onSelectDay('ALL')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            selectedDay === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Days
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedDay === 'ALL'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {totalStops}
          </span>
        </button>

        {dayGroups.map((group) => {
          const isSelected = selectedDay === group.day;
          return (
            <button
              key={group.day}
              type="button"
              onClick={() => onSelectDay(group.day)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? 'text-white shadow-xs border-transparent'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              style={
                isSelected
                  ? { backgroundColor: group.color, borderColor: group.color }
                  : undefined
              }
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: isSelected ? '#ffffff' : group.color,
                }}
              />
              <span>{group.day}</span>
              {group.date && (
                <span
                  className={`hidden sm:inline text-[11px] font-normal ${
                    isSelected ? 'text-white/85' : 'text-slate-400'
                  }`}
                >
                  ({group.date})
                </span>
              )}
              <span
                className={`px-1.5 rounded-full text-[10px] ${
                  isSelected
                    ? 'bg-black/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {group.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Category filter & Search input */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {categories.length > 0 && (
          <div className="relative flex items-center">
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="pl-7 pr-6 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative flex-1 sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter places, notes..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
