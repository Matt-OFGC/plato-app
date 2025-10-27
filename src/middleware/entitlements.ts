/**
 * Entitlements Middleware
 * Protects routes based on company module access
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkEntitlement, AppModule } from '@/lib/entitlements';

// Map route patterns to required modules
const routeModuleMap: Record<string, AppModule> = {
  '/dashboard/recipes': AppModule.RECIPES,
  '/dashboard/ingredients': AppModule.RECIPES,
  '/dashboard/recipe-mixer': AppModule.RECIPES,
  '/dashboard/staff': AppModule.STAFF,
  '/dashboard/wholesale': AppModule.WHOLESALE,
  '/dashboard/messages': AppModule.MESSAGING,
  '/dashboard/analytics': AppModule.ANALYTICS,
};

/**
 * Check if user has entitlement to access a route
 */
export async function checkRouteEntitlement(
  pathname: string,
  companyId: number
): Promise<{ allowed: boolean; reason?: string; redirectTo?: string }> {
  // Find matching route pattern
  const moduleEntry = Object.entries(routeModuleMap).find(([pattern]) =>
    pathname.startsWith(pattern)
  );

  // If route doesn't require specific module, allow access
  if (!moduleEntry) {
    return { allowed: true };
  }

  const [, requiredModule] = moduleEntry;

  // Check entitlement
  const check = await checkEntitlement(companyId, requiredModule);

  if (!check.hasAccess) {
    return {
      allowed: false,
      reason: check.reason,
      redirectTo: `/dashboard?locked=${requiredModule.toLowerCase()}&reason=${encodeURIComponent(check.reason || 'Access denied')}`,
    };
  }

  return { allowed: true };
}

/**
 * Middleware helper for API routes
 */
export async function requireEntitlement(
  req: NextRequest,
  companyId: number,
  module: AppModule
): Promise<NextResponse | null> {
  const check = await checkEntitlement(companyId, module);

  if (!check.hasAccess) {
    return NextResponse.json(
      {
        error: 'Access denied',
        reason: check.reason,
        module,
      },
      { status: 403 }
    );
  }

  return null;
}
