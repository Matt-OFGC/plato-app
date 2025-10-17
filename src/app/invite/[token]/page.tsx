"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface InvitationData {
  id: number;
  email: string;
  role: string;
  company: {
    id: number;
    name: string;
  };
  expiresAt: string;
}

export default function AcceptInvitationPage() {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      loadInvitation();
    } else {
      setError("Invalid invitation link");
      setLoading(false);
    }
  }, [token]);

  async function loadInvitation() {
    try {
      const res = await fetch(`/api/team/invitation?token=${token}`);
      const data = await res.json();
      
      if (res.ok) {
        setInvitation(data);
      } else {
        setError(data.error || "Invalid invitation");
      }
    } catch (err) {
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  }

  async function acceptInvitation() {
    if (!invitation || !token) return;

    setAccepting(true);
    setError("");

    try {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token,
          userEmail: invitation.email 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setError(data.error || "Failed to accept invitation");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg app-container max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg app-container max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-block bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg app-container max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Team!</h1>
          <p className="text-gray-600 mb-6">
            You've successfully joined {invitation?.company.name}. Redirecting to your dashboard...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const isExpired = new Date() > new Date(invitation.expiresAt);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg app-container max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
          <p className="text-gray-600">
            You've been invited to join <strong>{invitation.company.name}</strong>
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium capitalize">{invitation.role.toLowerCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Company:</span>
              <span className="font-medium">{invitation.company.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expires:</span>
              <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {isExpired ? (
          <div className="text-center">
            <p className="text-red-600 mb-4">This invitation has expired.</p>
            <Link
              href="/login"
              className="inline-block bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <button
              onClick={acceptInvitation}
              disabled={accepting}
              className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? "Accepting..." : "Accept Invitation"}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              By accepting this invitation, you agree to join the team and will have access based on your assigned role.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
