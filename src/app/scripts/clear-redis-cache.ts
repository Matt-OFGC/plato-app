import { deleteCachePattern } from '../lib/redis';

async function clearCache() {
  console.log('Clearing Redis cache...');
  
  try {
    // Clear all cache keys
    const deleted = await deleteCachePattern('*');
    console.log(`✅ Cleared ${deleted} cache keys`);
    
    // Also try to clear common patterns
    await deleteCachePattern('company:*');
    await deleteCachePattern('user:*');
    
    console.log('✅ Redis cache cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();

