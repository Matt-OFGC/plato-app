"use client";

import { useState, useEffect } from "react";

// Define roles as strings instead of importing from Prisma
type MemberRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

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

function getRoleDisplayName(role: MemberRole): string {
  switch (role) {
    case "OWNER": return "Owner";
    case "ADMIN": return "Admin";
    case "EDITOR": return "Editor";
    case "VIEWER": return "Viewer";
    default: return role;
  }
}

function getRoleDescription(role: MemberRole): string {
  switch (role) {
    case "OWNER": return "Full access, can manage team, billing, and delete company";
    case "ADMIN": return "Full access to content, can manage team members";
    case "EDITOR": return "Can create and edit all content";
    case "VIEWER": return "Read-only access to all content";
    default: return "";
  }
}

export function TeamManagerFixed({ companyId, currentUserRole }: { companyId: number; currentUserRole: MemberRole }) {
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
      setLoading(true);
      setError("");
      const res = await fetch(`/api/team/members?companyId=${companyId}`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        setInvitations(data.invitations || []);
      } else {
        setError(data.error || "Failed to load team members");
      }
    } catch (err) {
      console.error("Failed to load members:", err);
      setError("Network error. Please try again.");
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
        body: JSON.stringify({ companyId, email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteEmail("");
        setInviteRole("VIEWER");
        setSuccess(`Invitation sent to ${inviteEmail}!`);
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

  async function updateMemberRole(membershipId: number, newRole: MemberRole) {
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Member role updated successfully!");
        loadMembers();
      } else {
        setError(data.error || "Failed to update member role");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  }

  async function removeMember(membershipId: number) {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    
    try {
      const res = await fetch("/api/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, companyId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Team member removed successfully!");
        loadMembers();
      } else {
        setError(data.error || "Failed to remove team member");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Invite New Member */}
      {canManageTeam && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="VIEWER">Viewer - Read-only access</option>
                <option value="EDITOR">Editor - Can create and edit content</option>
                <option value="ADMIN">Admin - Can manage team members</option>
                <option value="OWNER">Owner - Full access (use carefully)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Send Invitation"}
            </button>
          </form>
        </div>
      )}

      {/* Current Team Members */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members ({members.length})</h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-semibold text-sm">
                        {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={(e) => updateMemberRole(member.id, e.target.value as MemberRole)}
                    disabled={!canManageTeam || member.role === "OWNER"}
                    className="text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                  {canManageTeam && member.role !== "OWNER" && (
                    <button
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-gray-500 text-center py-8">No team members found.</p>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Invitations ({invitations.length})</h3>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Invited as {getRoleDisplayName(invitation.role)} • 
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
