"use client";

interface PriceTrackingProps {
  companyId: number;
}

export default function PriceTracking({ companyId }: PriceTrackingProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
      <div className="text-6xl mb-4">💰</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Price Tracking</h3>
      <p className="text-gray-600">Monitor ingredient costs and trends - Coming soon!</p>
    </div>
  );
}
