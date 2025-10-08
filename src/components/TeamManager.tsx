"use client";

import { useState, useEffect } from "react";
import { MemberRole } from "@/generated/prisma";
import { getRoleDisplayName, getRoleDescription } from "@/lib/permissions";
import { SeatManager } from "./SeatManager";

interface TeamMember {
  id: number;
  role: MemberRole;
  userId: number;
  createdAt: string;
  user: {
    id: number;
    email: string;
    name: string | null;
    lastLoginAt: string | null;
  };
}

interface PendingInvitation {
  id: number;
  email: string;
  role: MemberRole;
  createdAt: string;
  expiresAt: string;
}

export function TeamManager({ companyId, currentUserRole }: { companyId: number; currentUserRole: MemberRole }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("VIEWER");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManageTeam = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  useEffect(() => {
    loadMembers();
  }, [companyId]);

  async function loadMembers() {
    try {
      const res = await fetch(`/api/team/members?companyId=${companyId}`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members);
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
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
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, companyId }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Invitation sent to ${inviteEmail}! Invite URL: ${data.inviteUrl}`);
        setInviteEmail("");
        loadMembers();
      } else {
        setError(data.error || "Failed to send invitation");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleUpdateRole(membershipId: number, newRole: MemberRole) {
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, role: newRole, companyId }),
      });

      if (res.ok) {
        setSuccess("Role updated successfully");
        loadMembers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update role");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  }

  async function handleRemoveMember(membershipId: number) {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const res = await fetch(`/api/team/members?membershipId=${membershipId}&companyId=${companyId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Team member removed successfully");
        loadMembers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to remove member");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading team members...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600 mt-1">Manage team members and their permissions</p>
        </div>
        <div className="text-sm text-gray-600">
          {members.length} / {members.length + 5} seats used
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {success}
        </div>
      )}

      {canManageTeam && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
                >
                  {currentUserRole === "OWNER" && <option value="OWNER">Owner</option>}
                  <option value="ADMIN">Administrator</option>
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{getRoleDescription(inviteRole)}</p>
              </div>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-md transition-all font-semibold disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Send Invitation"}
            </button>
          </form>
        </div>
      )}

      {/* Current Members */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Team Members ({members.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                  {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{member.user.name || "No name"}</p>
                  <p className="text-sm text-gray-600">{member.user.email}</p>
                  {member.user.lastLoginAt && (
                    <p className="text-xs text-gray-400">
                      Last login: {new Date(member.user.lastLoginAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canManageTeam ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateRole(member.id, e.target.value as MemberRole)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    disabled={member.role === "OWNER" && currentUserRole !== "OWNER"}
                  >
                    {currentUserRole === "OWNER" && <option value="OWNER">Owner</option>}
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    {getRoleDisplayName(member.role)}
                  </span>
                )}
                {canManageTeam && member.role !== "OWNER" && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Remove member"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {canManageTeam && invitations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Pending Invitations ({invitations.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {invitations.map((invite) => (
              <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{invite.email}</p>
                  <p className="text-sm text-gray-600">
                    Role: {getRoleDisplayName(invite.role)} · Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Information */}
      <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Permission Levels</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="font-semibold text-sm text-gray-900">👑 Owner</p>
            <p className="text-xs text-gray-600 mt-1">Full access including billing and team management</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="font-semibold text-sm text-gray-900">⚙️ Administrator</p>
            <p className="text-xs text-gray-600 mt-1">Full access to content and can manage team</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="font-semibold text-sm text-gray-900">✏️ Editor</p>
            <p className="text-xs text-gray-600 mt-1">Can create and edit all recipes and ingredients</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="font-semibold text-sm text-gray-900">👁️ Viewer</p>
            <p className="text-xs text-gray-600 mt-1">Can view all content but cannot make changes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

