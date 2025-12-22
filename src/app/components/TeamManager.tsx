"use client";

import { useState, useEffect } from "react";
import { MemberRole } from "@/generated/prisma";

interface TeamMember {
  id: number;
  role: MemberRole;
  userId: number;
  createdAt: string;
  staffPermissions?: {
    canEditIngredients?: boolean;
    canEditRecipes?: boolean;
  } | null;
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
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "STAFF":
      return "Staff";
    default:
      return role;
  }
}

function getRoleDescription(role: MemberRole): string {
  switch (role) {
    case "ADMIN":
      return "Full access to everything including company settings";
    case "MANAGER":
      return "Can view and edit everything except company settings";
    case "STAFF":
      return "View-only access, with optional permissions to edit ingredients and recipes";
    default:
      return "";
  }
}

export function TeamManager({ companyId, currentUserRole }: { companyId: number; currentUserRole: MemberRole }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("STAFF");
  const [inviteStaffPermissions, setInviteStaffPermissions] = useState({
    canEditIngredients: false,
    canEditRecipes: false,
  });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManageTeam = currentUserRole === "ADMIN";

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
      const body: any = { 
        email: inviteEmail, 
        role: inviteRole, 
        companyId 
      };

      // Include staffPermissions if STAFF role
      if (inviteRole === "STAFF") {
        body.staffPermissions = inviteStaffPermissions;
      }

      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Invitation sent to ${inviteEmail}!`);
        setInviteEmail("");
        setInviteRole("STAFF");
        setInviteStaffPermissions({ canEditIngredients: false, canEditRecipes: false });
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

  async function handleUpdateRole(membershipId: number, newRole: MemberRole, staffPermissions?: { canEditIngredients?: boolean; canEditRecipes?: boolean }) {
    try {
      const body: any = { 
        membershipId, 
        role: newRole, 
        companyId 
      };

      // Include staffPermissions if STAFF role
      if (newRole === "STAFF" && staffPermissions) {
        body.staffPermissions = staffPermissions;
      }

      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
                  onChange={(e) => {
                    setInviteRole(e.target.value as MemberRole);
                    // Reset staff permissions when role changes
                    if (e.target.value !== "STAFF") {
                      setInviteStaffPermissions({ canEditIngredients: false, canEditRecipes: false });
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="MANAGER">Manager</option>
                  <option value="STAFF">Staff</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{getRoleDescription(inviteRole)}</p>
              </div>
            </div>

            {/* Staff Permissions Checkboxes */}
            {inviteRole === "STAFF" && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Staff Permissions</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteStaffPermissions.canEditIngredients}
                      onChange={(e) => setInviteStaffPermissions(prev => ({ ...prev, canEditIngredients: e.target.checked }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Can edit ingredients</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteStaffPermissions.canEditRecipes}
                      onChange={(e) => setInviteStaffPermissions(prev => ({ ...prev, canEditRecipes: e.target.checked }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Can edit recipes</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Staff members can view everything by default. Check these boxes to allow editing of ingredients and recipes.</p>
              </div>
            )}

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
            <MemberRow
              key={member.id}
              member={member}
              canManageTeam={canManageTeam}
              onUpdateRole={handleUpdateRole}
              onRemove={handleRemoveMember}
            />
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
        <div className="grid gap-3 md:grid-cols-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="font-semibold text-sm text-gray-900">⚙️ Admin</p>
            <p className="text-xs text-gray-600 mt-1">Full access to everything including company settings</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="font-semibold text-sm text-gray-900">✏️ Manager</p>
            <p className="text-xs text-gray-600 mt-1">Can view and edit everything except company settings</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="font-semibold text-sm text-gray-900">👁️ Staff</p>
            <p className="text-xs text-gray-600 mt-1">View-only access, with optional permissions to edit ingredients and recipes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  canManageTeam,
  onUpdateRole,
  onRemove,
}: {
  member: TeamMember;
  canManageTeam: boolean;
  onUpdateRole: (membershipId: number, role: MemberRole, staffPermissions?: { canEditIngredients?: boolean; canEditRecipes?: boolean }) => void;
  onRemove: (membershipId: number) => void;
}) {
  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<MemberRole>(member.role);
  const [staffPermissions, setStaffPermissions] = useState({
    canEditIngredients: member.staffPermissions?.canEditIngredients || false,
    canEditRecipes: member.staffPermissions?.canEditRecipes || false,
  });

  const handleRoleChange = (newRole: MemberRole) => {
    setSelectedRole(newRole);
    if (newRole !== "STAFF") {
      setStaffPermissions({ canEditIngredients: false, canEditRecipes: false });
    }
  };

  const handleSave = () => {
    if (selectedRole === "STAFF") {
      onUpdateRole(member.id, selectedRole, staffPermissions);
    } else {
      onUpdateRole(member.id, selectedRole);
    }
    setEditingRole(false);
  };

  const handleCancel = () => {
    setSelectedRole(member.role);
    setStaffPermissions({
      canEditIngredients: member.staffPermissions?.canEditIngredients || false,
      canEditRecipes: member.staffPermissions?.canEditRecipes || false,
    });
    setEditingRole(false);
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
            {member.user.name?.[0] || member.user.email[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{member.user.name || "No name"}</p>
            <p className="text-sm text-gray-600">{member.user.email}</p>
            {member.user.lastLoginAt && (
              <p className="text-xs text-gray-400">
                Last login: {new Date(member.user.lastLoginAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {canManageTeam ? (
          <div className="flex items-center gap-3">
            {!editingRole ? (
              <>
                <div className="text-right">
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    {getRoleDisplayName(member.role)}
                  </span>
                  {member.role === "STAFF" && member.staffPermissions && (
                    <div className="text-xs text-gray-500 mt-1">
                      {member.staffPermissions.canEditIngredients && "Can edit ingredients"}
                      {member.staffPermissions.canEditIngredients && member.staffPermissions.canEditRecipes && " · "}
                      {member.staffPermissions.canEditRecipes && "Can edit recipes"}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEditingRole(true)}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                  title="Edit role"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onRemove(member.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Remove member"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 items-end">
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value as MemberRole)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="STAFF">Staff</option>
                </select>

                {selectedRole === "STAFF" && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mt-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffPermissions.canEditIngredients}
                          onChange={(e) => setStaffPermissions(prev => ({ ...prev, canEditIngredients: e.target.checked }))}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-700">Can edit ingredients</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffPermissions.canEditRecipes}
                          onChange={(e) => setStaffPermissions(prev => ({ ...prev, canEditRecipes: e.target.checked }))}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-700">Can edit recipes</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
            {getRoleDisplayName(member.role)}
          </span>
        )}
      </div>
    </div>
  );
}
