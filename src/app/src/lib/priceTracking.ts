// Price tracking utilities
export function formatLastUpdate(date: Date | string | null): string {
  if (!date) return 'Never';
  
  const updateDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - updateDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function checkPriceStatus(lastUpdate: Date | string | null): { status: 'fresh' | 'warning' | 'stale', daysSinceUpdate: number } {
  if (!lastUpdate) {
    return { status: 'stale', daysSinceUpdate: Infinity };
  }
  
  const updateDate = typeof lastUpdate === 'string' ? new Date(lastUpdate) : lastUpdate;
  const now = new Date();
  const diffMs = now.getTime() - updateDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Handle future dates or same-day updates (should be considered fresh)
  if (diffDays <= 0) {
    return { status: 'fresh', daysSinceUpdate: 0 };
  }
  
  // Prices need updating every 6 months (180 days)
  // fresh = less than 6 months old
  // warning = 6-12 months old (should consider updating)
  // stale = 12+ months old (definitely needs updating)
  if (diffDays < 180) return { status: 'fresh', daysSinceUpdate: diffDays };
  if (diffDays < 365) return { status: 'warning', daysSinceUpdate: diffDays };
  return { status: 'stale', daysSinceUpdate: diffDays };
}

export function getPriceStatusColorClass(status: 'fresh' | 'warning' | 'stale'): string {
  switch (status) {
    case 'fresh':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-amber-100 text-amber-800';
    case 'stale':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

