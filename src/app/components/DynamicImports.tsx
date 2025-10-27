'use client';

import dynamic from 'next/dynamic';
import { SkeletonCard, SkeletonList } from './SkeletonLoader';

// Loading components for better UX
const RecipeFormSkeleton = () => (
  <div className="space-y-6">
    <SkeletonCard />
    <SkeletonList count={3} />
  </div>
);

const ProductionSkeleton = () => (
  <div className="space-y-4">
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
);

const WholesaleSkeleton = () => (
  <div className="space-y-6">
    <SkeletonCard />
    <SkeletonList count={5} />
  </div>
);

// Dynamic imports for heavy components
export const UnifiedRecipeForm = dynamic(
  () => import('./UnifiedRecipeForm').then(mod => ({ default: mod.UnifiedRecipeForm })),
  {
    loading: () => <RecipeFormSkeleton />,
    ssr: false, // Disable SSR for better performance
  }
);

export const RecipePageInlineCompleteV2 = dynamic(
  () => import('./RecipePageInlineCompleteV2').then(mod => ({ default: mod.RecipePageInlineCompleteV2 })),
  {
    loading: () => <RecipeFormSkeleton />,
    ssr: false,
  }
);

export const ProductionPlanner = dynamic(
  () => import('./ProductionPlanner').then(mod => ({ default: mod.ProductionPlanner })),
  {
    loading: () => <ProductionSkeleton />,
    ssr: false,
  }
);

export const WholesaleOrders = dynamic(
  () => import('./WholesaleOrders').then(mod => ({ default: mod.WholesaleOrders })),
  {
    loading: () => <WholesaleSkeleton />,
    ssr: false,
  }
);

export const WholesaleProducts = dynamic(
  () => import('./WholesaleProducts').then(mod => ({ default: mod.WholesaleProducts })),
  {
    loading: () => <WholesaleSkeleton />,
    ssr: false,
  }
);

export const SmartImporter = dynamic(
  () => import('./SmartImporter').then(mod => ({ default: mod.SmartImporter })),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);

export const InvoiceScanner = dynamic(
  () => import('./InvoiceScanner').then(mod => ({ default: mod.InvoiceScanner })),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);

export const MenuScanner = dynamic(
  () => import('./MenuScanner').then(mod => ({ default: mod.MenuScanner })),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);

// Analytics components (can be heavy)
export const SystemAnalytics = dynamic(
  () => import('./SystemAnalytics').then(mod => ({ default: mod.SystemAnalytics })),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);

// Dashboard components
export const OperationalDashboard = dynamic(
  () => import('./OperationalDashboard').then(mod => ({ default: mod.OperationalDashboard })),
  {
    loading: () => <ProductionSkeleton />,
    ssr: false,
  }
);

// Preload critical components on hover
export const preloadComponents = () => {
  // Preload components that are likely to be used
  import('./UnifiedRecipeForm');
  import('./ProductionPlanner');
  import('./WholesaleOrders');
};

// Hook to preload components
export const usePreloadComponents = () => {
  React.useEffect(() => {
    // Preload after initial load
    const timer = setTimeout(preloadComponents, 2000);
    return () => clearTimeout(timer);
  }, []);
};
