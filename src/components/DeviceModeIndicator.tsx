"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function DeviceModeIndicator() {
  const router = useRouter();
  const [deviceCompany, setDeviceCompany] = useState<{ companyId: number; companyName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDeviceMode();
  }, []);

  async function checkDeviceMode() {
    try {
      const res = await fetch("/api/device-login");
      const data = await res.json();
      
      if (data.deviceCompany) {
        setDeviceCompany(data.deviceCompany);
      }
    } catch (err) {
      console.error("Failed to check device mode:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisableDeviceMode() {
    if (!confirm("Remove company login from this device? Team members will no longer be able to use PIN login on this device.")) {
      return;
    }

    try {
      await fetch("/api/device-login", { method: "DELETE" });
      setDeviceCompany(null);
      router.refresh();
    } catch (err) {
      console.error("Failed to disable device mode:", err);
    }
  }

  if (loading || !deviceCompany) {
    return null;
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-900">Device Mode Active</p>
            <p className="text-sm text-emerald-700">
              Team members can use PIN login for <strong>{deviceCompany.companyName}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={handleDisableDeviceMode}
          className="text-sm text-emerald-700 hover:text-emerald-900 underline"
        >
          Disable
        </button>
      </div>
    </div>
  );
}

