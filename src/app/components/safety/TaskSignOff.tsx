"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TaskSignOffProps {
  task: any;
  checklistState: Record<number, any>;
  onComplete: () => void;
  onCancel: () => void;
}

export function TaskSignOff({ task, checklistState, onComplete, onCancel }: TaskSignOffProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadTeamMembers();
  }, []);

  async function loadTeamMembers() {
    try {
      // Get company ID from session
      const sessionRes = await fetch("/api/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        const companyId = sessionData.company?.id;
        
        if (companyId) {
          const response = await fetch(`/api/team/members?companyId=${companyId}`);
          if (response.ok) {
            const data = await response.json();
            // Filter members who have PINs set
            const membersWithPins = data.members?.filter((m: any) => m.pin) || [];
            setTeamMembers(membersWithPins);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load team members:", error);
    }
  }

  function handlePinChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return; // Only digits
    const newPin = [...pin];
    newPin[index] = value.slice(0, 1);
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  }

  async function handleSubmit() {
    if (!selectedMember) {
      setError("Please select who completed this task");
      return;
    }

    const pinString = pin.join("");
    if (pinString.length !== 4) {
      setError("Please enter a 4-digit PIN");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare checklist items for submission
      const checklistItems = task.checklistItems.map((item: any, index: number) => {
        const state = checklistState[index] || {};
        return {
          itemText: item.itemText,
          itemOrder: item.itemOrder,
          checked: state.checked || false,
          temperatureValue: state.temperature || null,
          temperatureUnit: "celsius",
          notes: state.notes || "",
        };
      });

      const response = await fetch(`/api/safety/tasks/${task.id}/sign-off`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedBy: selectedMember,
          pin: pinString,
          notes,
          checklistItems,
          status: "completed",
          deviceId: navigator.userAgent,
        }),
      });

      if (response.ok) {
        onComplete();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to complete task");
      }
    } catch (error) {
      console.error("Sign-off error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const pinComplete = pin.join("").length === 4;
  const canSubmit = selectedMember && pinComplete && !loading;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sign Off Task</h1>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      {/* Who Completed */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Who completed this task?</h2>
        <div className="grid grid-cols-2 gap-3">
          {teamMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member.user?.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedMember === member.user?.id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                  {member.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{member.user?.name || "Unknown"}</div>
                  <div className="text-sm text-gray-600">{member.role}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* PIN Verification */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Your PIN</h2>
        <div className="flex gap-3 justify-center">
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              id={`pin-${index}`}
              type="password"
              maxLength={1}
              value={pin[index]}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handlePinKeyDown(index, e)}
              className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          ))}
        </div>
        {error && (
          <p className="text-red-600 text-sm mt-3 text-center">{error}</p>
        )}
      </section>

      {/* Additional Notes */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations or comments..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </section>

      {/* Timestamp */}
      <section className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Completion Details</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Date: {new Date().toLocaleDateString("en-GB")}</div>
          <div>Time: {new Date().toLocaleTimeString("en-GB")}</div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Completing..." : "Complete & Sign Off"}
        </button>
      </div>
    </div>
  );
}

