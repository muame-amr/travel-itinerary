export const DAY_COLORS = [
  '#4F46E5', // Indigo (Day 1)
  '#0D9488', // Teal (Day 2)
  '#EA580C', // Orange (Day 3)
  '#DB2777', // Pink (Day 4)
  '#7C3AED', // Violet (Day 5)
  '#2563EB', // Blue (Day 6)
  '#059669', // Emerald (Day 7)
  '#D97706', // Amber (Day 8)
  '#DC2626', // Red (Day 9)
  '#475569', // Slate (Day 10+)
];

export function getDayColor(dayNumber: number): string {
  const index = Math.max(0, dayNumber - 1) % DAY_COLORS.length;
  return DAY_COLORS[index];
}

export function getCategoryStyle(category?: string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (!category) {
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      label: 'Stop',
    };
  }

  const c = category.toLowerCase();
  if (c.includes('food') || c.includes('dining') || c.includes('restaurant') || c.includes('cafe') || c.includes('lunch') || c.includes('dinner') || c.includes('breakfast')) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      label: category,
    };
  }
  if (c.includes('sight') || c.includes('temple') || c.includes('shrine') || c.includes('landmark') || c.includes('park')) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      label: category,
    };
  }
  if (c.includes('museum') || c.includes('art') || c.includes('culture') || c.includes('attract')) {
    return {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      label: category,
    };
  }
  if (c.includes('shop') || c.includes('market') || c.includes('mall')) {
    return {
      bg: 'bg-pink-50',
      text: 'text-pink-800',
      border: 'border-pink-200',
      label: category,
    };
  }
  if (c.includes('hotel') || c.includes('stay') || c.includes('check-in') || c.includes('accommodation') || c.includes('lodging')) {
    return {
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      label: category,
    };
  }
  if (c.includes('transit') || c.includes('train') || c.includes('flight') || c.includes('bus') || c.includes('transport') || c.includes('airport')) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      label: category,
    };
  }

  return {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    label: category,
  };
}
