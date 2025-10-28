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

export function checkPriceStatus(lastUpdate: Date | string | null): 'fresh' | 'stale' | 'very-stale' {
  if (!lastUpdate) return 'very-stale';
  
  const updateDate = typeof lastUpdate === 'string' ? new Date(lastUpdate) : lastUpdate;
  const now = new Date();
  const diffMs = now.getTime() - updateDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return 'fresh';
  if (diffDays <= 30) return 'stale';
  return 'very-stale';
}

export function getPriceStatusColorClass(status: 'fresh' | 'stale' | 'very-stale'): string {
  switch (status) {
    case 'fresh':
      return 'text-green-600';
    case 'stale':
      return 'text-yellow-600';
    case 'very-stale':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
