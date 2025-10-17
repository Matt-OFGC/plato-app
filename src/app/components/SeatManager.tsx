"use client";

import { useState, useEffect } from "react";

interface SeatInfo {
  currentSeats: number;
  maxSeats: number;
  pricePerSeat: number;
  basePrice: number;
  additionalSeats: number;
  monthlyTotal: number;
}

interface SeatManagerProps {
  companyId: number;
  canManageBilling: boolean;
}

export function SeatManager({ companyId, canManageBilling }: SeatManagerProps) {
  const [seatInfo, setSeatInfo] = useState<SeatInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeatInfo();
  }, [companyId]);

  async function loadSeatInfo() {
    try {
      setLoading(true);
      const res = await fetch(`/api/team/seats?companyId=${companyId}`);
      const data = await res.json();
      if (res.ok) {
        setSeatInfo(data);
      } else {
        console.error("Failed to load seat info:", data.error);
      }
    } catch (err) {
      console.error("Failed to load seat info:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!seatInfo) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-gray-600">Unable to load seat information</p>
      </div>
    );
  }

  const { currentSeats, maxSeats, pricePerSeat, basePrice, additionalSeats, monthlyTotal } = seatInfo;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Seat Management</h3>
        {canManageBilling && (
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Manage Billing
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Usage */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Current Usage</span>
            <span className="text-sm text-gray-500">{currentSeats} of {maxSeats} seats</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((currentSeats / maxSeats) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {currentSeats >= maxSeats ? "At capacity" : `${maxSeats - currentSeats} seats remaining`}
          </p>
        </div>

        {/* Monthly Cost */}
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Monthly Cost</span>
            <span className="text-lg font-semibold text-emerald-600">£{monthlyTotal.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Base Plan:</span>
              <span>£{basePrice.toFixed(2)}</span>
            </div>
            {additionalSeats > 0 && (
              <div className="flex justify-between">
                <span>Additional Seats ({additionalSeats}):</span>
                <span>£{(additionalSeats * pricePerSeat).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Pricing Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Plan (includes 1 seat)</span>
            <span className="font-medium">£{basePrice.toFixed(2)}/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Additional seats</span>
            <span className="font-medium">£{pricePerSeat.toFixed(2)}/seat/month</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total Monthly</span>
              <span>£{monthlyTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Notice */}
      {currentSeats >= maxSeats && canManageBilling && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">At Capacity</h4>
              <p className="text-sm text-yellow-700 mt-1">
                You've reached your seat limit. Upgrade your plan to add more team members.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
