/**
 * Ingredient price tracking and staleness detection utilities
 */

export interface PriceStatus {
  status: 'current' | 'warning' | 'stale';
  daysSinceUpdate: number;
  monthsSinceUpdate: number;
  message: string;
}

/**
 * Check if ingredient price needs updating
 * Warning: 6+ months old
 * Stale: 12+ months old
 */
export function checkPriceStatus(lastPriceUpdate: Date): PriceStatus {
  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - lastPriceUpdate.getTime()) / (1000 * 60 * 60 * 24));
  const monthsSinceUpdate = Math.floor(daysSinceUpdate / 30);

  if (daysSinceUpdate < 180) {
    // Less than 6 months
    return {
      status: 'current',
      daysSinceUpdate,
      monthsSinceUpdate,
      message: 'Price is current',
    };
  } else if (daysSinceUpdate < 365) {
    // 6-12 months
    return {
      status: 'warning',
      daysSinceUpdate,
      monthsSinceUpdate,
      message: `Last updated ${monthsSinceUpdate} months ago - consider reviewing`,
    };
  } else {
    // 12+ months
    return {
      status: 'stale',
      daysSinceUpdate,
      monthsSinceUpdate,
      message: `Last updated ${monthsSinceUpdate} months ago - price likely outdated`,
    };
  }
}

/**
 * Get color class for price status
 */
export function getPriceStatusColorClass(status: 'current' | 'warning' | 'stale'): string {
  switch (status) {
    case 'current':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'warning':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'stale':
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

/**
 * Format last update date nicely
 */
export function formatLastUpdate(lastPriceUpdate: Date): string {
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastPriceUpdate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince === 0) {
    return 'Today';
  } else if (daysSince === 1) {
    return 'Yesterday';
  } else if (daysSince < 7) {
    return `${daysSince} days ago`;
  } else if (daysSince < 30) {
    const weeks = Math.floor(daysSince / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (daysSince < 365) {
    const months = Math.floor(daysSince / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(daysSince / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Get icon for price status
 */
export function getPriceStatusIcon(status: 'current' | 'warning' | 'stale'): string {
  switch (status) {
    case 'current':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'stale':
      return '🔴';
  }
}

