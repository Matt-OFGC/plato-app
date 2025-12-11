import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function HealthMonitoringPage() {
  const session = await getUserFromSession();
  
  if (!session || !session.isAdmin) {
    redirect("/dashboard");
  }

  // Get system health metrics
  const [
    totalUsers,
    usersWithMemberships,
    orphanedUsers,
    usersWithOnlyInactive,
    totalMemberships,
    activeMemberships,
    inactiveMemberships,
    recentAutoRepairs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        memberships: {
          some: {},
        },
      },
    }),
    prisma.user.count({
      where: {
        memberships: {
          none: {},
        },
      },
    }),
    prisma.user.count({
      where: {
        memberships: {
          some: {
            isActive: false,
          },
          none: {
            isActive: true,
          },
        },
      },
    }),
    prisma.membership.count(),
    prisma.membership.count({
      where: { isActive: true },
    }),
    prisma.membership.count({
      where: { isActive: false },
    }),
    prisma.activityLog.findMany({
      where: {
        action: 'AUTO_REPAIR',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const healthScore = calculateHealthScore({
    orphanedUsers,
    usersWithOnlyInactive,
    totalUsers,
    inactiveMemberships,
    totalMemberships,
  });

  return (
    <div className="app-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Health Monitoring</h1>
        <p className="text-gray-600 mt-2">Monitor membership health and system status</p>
      </div>

      {/* Health Score */}
      <div className="mb-8">
        <div className={`rounded-xl p-6 ${
          healthScore >= 95 ? 'bg-green-50 border border-green-200' :
          healthScore >= 80 ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Health Score</h2>
              <p className="text-gray-600">
                {healthScore >= 95 ? 'System is healthy' :
                 healthScore >= 80 ? 'Minor issues detected' :
                 'Critical issues detected'}
              </p>
            </div>
            <div className="text-5xl font-bold text-gray-900">
              {healthScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          status="neutral"
        />
        <MetricCard
          title="Users with Memberships"
          value={usersWithMemberships.toLocaleString()}
          status="good"
        />
        <MetricCard
          title="Orphaned Users"
          value={orphanedUsers.toLocaleString()}
          status={orphanedUsers === 0 ? "good" : "warning"}
          description="Users with no memberships"
        />
        <MetricCard
          title="Users with Only Inactive"
          value={usersWithOnlyInactive.toLocaleString()}
          status={usersWithOnlyInactive === 0 ? "good" : "warning"}
          description="Users with inactive memberships only"
        />
      </div>

      {/* Membership Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Memberships"
          value={totalMemberships.toLocaleString()}
          status="neutral"
        />
        <MetricCard
          title="Active Memberships"
          value={activeMemberships.toLocaleString()}
          status="good"
        />
        <MetricCard
          title="Inactive Memberships"
          value={inactiveMemberships.toLocaleString()}
          status={inactiveMemberships === 0 ? "good" : "warning"}
        />
      </div>

      {/* Recent Auto-Repairs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Auto-Repairs</h2>
        {recentAutoRepairs.length === 0 ? (
          <p className="text-gray-500">No recent auto-repairs</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAutoRepairs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.user?.email || `User ${log.userId}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(log.details as any)?.repairType || 'unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <a
          href="/api/admin/repair-memberships-job"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Run Repair Job Now
        </a>
        <a
          href="/api/health"
          target="_blank"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          View Health API
        </a>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  status,
  description,
}: {
  title: string;
  value: string;
  status: "good" | "warning" | "neutral";
  description?: string;
}) {
  const statusColors = {
    good: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    neutral: "border-gray-200 bg-white",
  };

  return (
    <div className={`rounded-xl border p-6 ${statusColors[status]}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

function calculateHealthScore(metrics: {
  orphanedUsers: number;
  usersWithOnlyInactive: number;
  totalUsers: number;
  inactiveMemberships: number;
  totalMemberships: number;
}): number {
  if (metrics.totalUsers === 0) return 100;

  // Calculate issues percentage
  const orphanedPercentage = (metrics.orphanedUsers / metrics.totalUsers) * 100;
  const inactiveOnlyPercentage = (metrics.usersWithOnlyInactive / metrics.totalUsers) * 100;
  const inactiveMembershipPercentage = metrics.totalMemberships > 0
    ? (metrics.inactiveMemberships / metrics.totalMemberships) * 100
    : 0;

  // Health score starts at 100 and decreases based on issues
  let score = 100;
  score -= orphanedPercentage * 2; // Orphaned users are critical
  score -= inactiveOnlyPercentage * 1.5; // Inactive-only users are important
  score -= Math.min(inactiveMembershipPercentage * 0.5, 10); // Some inactive memberships are OK

  return Math.max(0, Math.min(100, Math.round(score)));
}
