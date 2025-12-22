"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Member {
  id: number;
  userId: number;
  companyId: number;
  role: string;
  isActive: boolean;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  staffProfile?: any;
}

interface PendingInvitation {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

interface TeamManagementClientProps {
  companyId: number;
  currentUserRole: string;
  members: Member[];
}

function getRoleDisplayName(role: string): string {
  switch (role) {
    case "ADMIN": return "Admin";
    case "MANAGER": return "Manager";
    case "STAFF": return "Staff";
    default: return role;
  }
}

function getRoleDescription(role: string): string {
  switch (role) {
    case "ADMIN": return "Full access to all features and settings";
    case "MANAGER": return "Can view and edit everything except company settings";
    case "STAFF": return "Read-only access (can be granted permissions to edit ingredients and recipes)";
    default: return "";
  }
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "ADMIN": return "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/20";
    case "MANAGER": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    case "STAFF": return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    default: return "bg-gray-500/10 text-gray-700 border-gray-500/20";
  }
}

export default function TeamManagementClient({
  companyId,
  currentUserRole,
  members,
}: TeamManagementClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("STAFF");
  const [invitePosition, setInvitePosition] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteStartDate, setInviteStartDate] = useState("");
  const [inviteEmergencyContactName, setInviteEmergencyContactName] = useState("");
  const [inviteEmergencyContactPhone, setInviteEmergencyContactPhone] = useState("");
  const [inviteNotes, setInviteNotes] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const canManageAll = currentUserRole === "ADMIN";

  const tabs: Array<{ id: string; label: string; icon?: string }> = [
    { id: "overview", label: "Overview" },
    { id: "profiles", label: "Team Members" },
    { id: "training", label: "Training" },
  ];

  useEffect(() => {
    loadInvitations();
  }, [companyId]);

  async function loadInvitations() {
    try {
      setLoading(true);
      const res = await fetch(`/api/team/members?companyId=${companyId}`);
      const data = await res.json();
      if (res.ok) {
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Failed to load invitations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setInviting(true);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: inviteEmail,
          name: inviteName || null,
          role: inviteRole, 
          companyId,
          // Staff profile data
          position: invitePosition || null,
          phone: invitePhone || null,
          employmentStartDate: inviteStartDate || null,
          emergencyContactName: inviteEmergencyContactName || null,
          emergencyContactPhone: inviteEmergencyContactPhone || null,
          notes: inviteNotes || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Invitation sent to ${inviteEmail}!`);
        // Reset all fields
        setInviteEmail("");
        setInviteName("");
        setInvitePosition("");
        setInvitePhone("");
        setInviteStartDate("");
        setInviteEmergencyContactName("");
        setInviteEmergencyContactPhone("");
        setInviteNotes("");
        setShowInviteModal(false);
        loadInvitations();
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Failed to send invitation");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Invite Button */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage team members, permissions, and assignments</p>
          </div>
          {canManageAll && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-2">
        <nav className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 min-w-fit py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              {tab.icon && <span className="mr-1">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Team Members Stat Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Team Members</h3>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900">{members.length}</p>
              <p className="text-sm text-gray-600 mt-1">active members</p>
            </div>

            {/* Pending Invitations Stat Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending Invites</h3>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900">{invitations.length}</p>
              <p className="text-sm text-gray-600 mt-1">pending invitations</p>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Quick Actions</h3>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                {canManageAll && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full text-left px-4 py-2 bg-gradient-to-r from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/10 rounded-lg hover:from-[var(--brand-primary)]/20 hover:to-[var(--brand-accent)]/20 transition-all text-sm font-medium text-[var(--brand-primary)]"
                  >
                    Invite Team Member
                  </button>
                )}
                <Link
                  href="/dashboard/training"
                  className="block w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                >
                  Manage Training
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profiles" && (
          <div className="space-y-4">
            {/* Pending Invitations Section */}
            {canManageAll && invitations.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Invitations ({invitations.length})</h2>
                <div className="space-y-3">
                  {invitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{invite.email}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Role: {getRoleDisplayName(invite.role)} · Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium border border-amber-200">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members Grid */}
            {members.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">No team members found.</p>
                {canManageAll && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Invite Your First Member
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {members.map((member) => (
                  <Link
                    key={member.id}
                    href={`/dashboard/team/${member.id}`}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 hover:shadow-xl hover:border-[var(--brand-primary)]/50 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-[var(--brand-primary)] transition-colors">
                          {member.user.name || "Team Member"}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                        {getRoleDisplayName(member.role)}
                      </span>
                      {member.staffProfile && (
                        <span className="text-xs text-gray-500">Profile</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "training" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Training Management</h2>
              <p className="text-gray-600 mt-1 text-sm">View and manage team training records</p>
            </div>
            <Link
              href="/dashboard/training"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-200"
            >
              Go to Training Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Invite Team Member</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setError("");
                  setInviteEmail("");
                  setInviteName("");
                  setInvitePosition("");
                  setInvitePhone("");
                  setInviteStartDate("");
                  setInviteEmergencyContactName("");
                  setInviteEmergencyContactPhone("");
                  setInviteNotes("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4 pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                    placeholder="colleague@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                  >
                    <option value="ADMIN">Admin - Full access</option>
                    <option value="MANAGER">Manager - Can edit most things</option>
                    <option value="STAFF">Staff - Read-only (can grant permissions)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{getRoleDescription(inviteRole)}</p>
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4 pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Employment Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position/Job Title <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={invitePosition}
                    onChange={(e) => setInvitePosition(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                    placeholder="e.g., Head Baker, Barista, Kitchen Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                    placeholder="+44 7700 900000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Start Date <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={inviteStartDate}
                    onChange={(e) => setInviteStartDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4 pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Emergency Contact</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={inviteEmergencyContactName}
                    onChange={(e) => setInviteEmergencyContactName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={inviteEmergencyContactPhone}
                    onChange={(e) => setInviteEmergencyContactPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                    placeholder="+44 7700 900000"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
                  placeholder="Any additional information about this team member..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setError("");
                    setInviteEmail("");
                    setInviteName("");
                    setInvitePosition("");
                    setInvitePhone("");
                    setInviteStartDate("");
                    setInviteEmergencyContactName("");
                    setInviteEmergencyContactPhone("");
                    setInviteNotes("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
