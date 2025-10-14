"use client";

import React from "react";
import { Users, Plus } from "lucide-react";

interface SeatUsageWidgetProps {
  currentSeats: number;
  maxSeats: number | null; // null means unlimited
  companyId: number;
  canManage?: boolean;
}

export function SeatUsageWidget({
  currentSeats,
  maxSeats,
  companyId,
  canManage = true,
}: SeatUsageWidgetProps) {
  const isUnlimited = maxSeats === null;
  const usagePercent = !isUnlimited && maxSeats > 0 ? (currentSeats / maxSeats) * 100 : 0;
  const isNearLimit = !isUnlimited && usagePercent >= 80;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Team Seats</h3>
          <p className="text-sm text-gray-600">
            {isUnlimited ? (
              <>
                {currentSeats} {currentSeats === 1 ? "member" : "members"} • Unlimited seats
              </>
            ) : (
              <>
                {currentSeats} of {maxSeats} seats used
              </>
            )}
          </p>
        </div>
      </div>

      {!isUnlimited && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isNearLimit ? "bg-amber-500" : "bg-blue-600"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          {isNearLimit && (
            <p className="text-xs text-amber-600 mt-2">
              You're approaching your seat limit
            </p>
          )}
        </div>
      )}

      {canManage && (
        <div className="flex gap-2">
          <a
            href="/dashboard/team"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Invite Members
          </a>
          {!isUnlimited && (
            <a
              href="/pricing?highlight=team"
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Add Seats
            </a>
          )}
        </div>
      )}
    </div>
  );
}

