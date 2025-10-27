"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PinLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [deviceCompany, setDeviceCompany] = useState<{ companyId: number; companyName: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDevice, setLoadingDevice] = useState(true);

  useEffect(() => {
    checkDeviceSession();
  }, []);

  async function checkDeviceSession() {
    try {
      const res = await fetch("/api/device-login");
      const data = await res.json();
      
      if (data.deviceCompany) {
        setDeviceCompany(data.deviceCompany);
      } else {
        // No device session - redirect to regular login
        router.push("/login");
      }
    } catch (err) {
      console.error("Failed to check device session:", err);
      router.push("/login");
    } finally {
      setLoadingDevice(false);
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!deviceCompany) {
      setError("No device session found");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Verify PIN
      const res = await fetch("/api/team/pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pin, 
          companyId: deviceCompany.companyId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Create user session
        const sessionRes = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: data.user.id,
            email: data.user.email,
            name: data.user.name,
            pinAuth: true, // Flag to indicate PIN-based auth
          }),
        });

        if (sessionRes.ok) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setError("Failed to create session");
        }
      } else {
        setError(data.error || "Invalid PIN");
        setPin(""); // Clear PIN on error
      }
    } catch (err) {
      console.error("PIN login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePinInput(value: string) {
    // Only allow digits, max 6 characters
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setPin(cleaned);
  }

  async function handleClearDevice() {
    if (!confirm("This will remove the company session from this device. Continue?")) {
      return;
    }

    try {
      await fetch("/api/device-login", { method: "DELETE" });
      router.push("/login");
    } catch (err) {
      console.error("Failed to clear device session:", err);
    }
  }

  if (loadingDevice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="app-container max-w-md w-full space-y-8">
        {/* Company Info */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/plato-logo.png" 
              alt="Plato" 
              className="h-12 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {deviceCompany?.companyName}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your PIN to access the system
          </p>
        </div>

        {/* PIN Entry Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter Your PIN
              </label>
              <input 
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-center text-3xl font-bold tracking-widest" 
                value={pin} 
                onChange={(e) => handlePinInput(e.target.value)}
                placeholder="••••"
                required
                maxLength={6}
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                4-6 digit PIN provided by your manager
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:shadow-md transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Access System"}
            </button>
          </form>

          {/* Quick PIN Pad (optional) */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinInput(pin + num)}
                disabled={pin.length >= 6}
                className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-semibold transition-colors disabled:opacity-50"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePinInput(pin.slice(0, -1))}
              className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-semibold transition-colors"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => handlePinInput(pin + "0")}
              disabled={pin.length >= 6}
              className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-semibold transition-colors disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin("")}
              className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="text-center">
          <button
            onClick={handleClearDevice}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Remove company from this device
          </button>
        </div>
      </div>
    </div>
  );
}

