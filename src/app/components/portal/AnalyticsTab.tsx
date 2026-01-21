"use client";

import { useEffect, useMemo, useState } from "react";

type AnalyticsResponse = {
  period: { days: number; startDate: string };
  totals: { delivered: number; sold: number; wasted: number };
  avgSellThrough: number;
  wasteRate: number;
  dailyTrend: Array<{ date: string; sold: number }>;
  productPerformance: Array<{
    productName: string;
    totalSold: number;
    totalWasted: number;
    sellThroughRate: number;
  }>;
};

export function AnalyticsTab({ token }: { token: string }) {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/wholesale/portal/${token}/analytics?days=${days}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load analytics");
        setAnalytics(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, days]);

  const maxSold = useMemo(() => {
    if (!analytics?.dailyTrend?.length) return 1;
    return Math.max(...analytics.dailyTrend.map((d) => d.sold), 1);
  }, [analytics]);

  const sparkline = useMemo(() => {
    if (!analytics?.dailyTrend?.length) return null;
    const w = 240;
    const h = 60;
    const maxY = Math.max(...analytics.dailyTrend.map((d) => d.sold), 1);
    const step = analytics.dailyTrend.length > 1 ? w / (analytics.dailyTrend.length - 1) : w;
    const points = analytics.dailyTrend.map((d, idx) => {
      const x = idx * step;
      const y = h - (d.sold / maxY) * (h - 6) - 3;
      return `${x},${y}`;
    });
    return { w, h, points: points.join(" ") };
  }, [analytics]);

  if (loading) return <p className="text-sm text-gray-600">Loading analytics...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Analytics</h2>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="border rounded p-2"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Units Sold" value={analytics.totals.sold.toString()} />
        <StatCard
          label="Sell-through"
          value={`${analytics.avgSellThrough.toFixed(1)}%`}
          tone={analytics.avgSellThrough > 85 ? "good" : "warn"}
        />
        <StatCard label="Units Wasted" value={analytics.totals.wasted.toString()} tone="bad" />
        <StatCard
          label="Waste Rate"
          value={`${analytics.wasteRate.toFixed(1)}%`}
          tone={analytics.wasteRate < 8 ? "good" : "bad"}
        />
      </div>

      <div className="p-4 border rounded-lg bg-white space-y-3">
        <h3 className="font-semibold">Daily trend</h3>
        {analytics.dailyTrend.length === 0 ? (
          <p className="text-sm text-gray-600">No data yet. Submit stock checks to populate analytics.</p>
        ) : (
          <div className="space-y-3">
            {sparkline && (
              <svg viewBox={`0 0 ${sparkline.w} ${sparkline.h}`} className="w-full h-16">
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  points={sparkline.points}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <div className="space-y-2">
              {analytics.dailyTrend.map((d) => {
                const width = `${Math.max((d.sold / maxSold) * 100, 5)}%`;
                return (
                  <div key={d.date}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{new Date(d.date).toLocaleDateString()}</span>
                      <span>{d.sold} sold</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-2 bg-emerald-500" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border rounded-lg bg-white space-y-3">
        <h3 className="font-semibold">Product performance</h3>
        {analytics.productPerformance.length === 0 ? (
          <p className="text-sm text-gray-600">No product data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left">
                <tr>
                  <th className="py-2">Product</th>
                  <th className="py-2 text-right">Sold</th>
                  <th className="py-2 text-right">Wasted</th>
                  <th className="py-2 text-right">Sell-through</th>
                </tr>
              </thead>
              <tbody>
                {analytics.productPerformance.map((p, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 font-medium">{p.productName}</td>
                    <td className="py-2 text-right">{p.totalSold}</td>
                    <td className="py-2 text-right text-red-600">{p.totalWasted}</td>
                    <td className="py-2 text-right">
                      <span
                        className={
                          p.sellThroughRate > 85
                            ? "text-emerald-600 font-semibold"
                            : "text-amber-600 font-semibold"
                        }
                      >
                        {p.sellThroughRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "bad"
          ? "text-red-700"
          : "text-gray-900";

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="text-xs text-gray-600">{label}</div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

