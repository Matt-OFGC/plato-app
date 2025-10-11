"use client";

import { useState, useEffect } from "react";

// Define roles as strings instead of importing from Prisma
type MemberRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

interface TeamMember {
  id: number;
  role: MemberRole;
  userId: number;
  createdAt: string;
  pin: string | null;
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

export function TeamManagerWithPins({ companyId, currentUserRole }: { companyId: number; currentUserRole: MemberRole }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberName, setAddMemberName] = useState("");
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberRole, setAddMemberRole] = useState<MemberRole>("VIEWER");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);

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

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAdding(true);

    try {
      // First, create or find the user account
      const userRes = await fetch("/api/team/create-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          companyId, 
          name: addMemberName,
          email: addMemberEmail, 
          role: addMemberRole 
        }),
      });
      const userData = await userRes.json();
      
      if (userRes.ok) {
        setAddMemberName("");
        setAddMemberEmail("");
        setAddMemberRole("VIEWER");
        setSuccess(`Team member added successfully!`);
        loadMembers();
      } else {
        setError(userData.error || "Failed to add team member");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function generatePin(member: TeamMember) {
    try {
      const res = await fetch("/api/team/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          membershipId: member.id,
          companyId,
        }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setGeneratedPin(data.pin);
        setSelectedMember(member);
        setShowPinModal(true);
        loadMembers();
      } else {
        setError(data.error || "Failed to generate PIN");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  }

  async function resetPin(member: TeamMember) {
    if (!confirm("Are you sure you want to reset this member's PIN?")) return;
    
    try {
      const res = await fetch(`/api/team/pin?membershipId=${member.id}&companyId=${companyId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setSuccess("PIN reset successfully");
        loadMembers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset PIN");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  }

  async function updateMemberRole(membershipId: number, newRole: MemberRole) {
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, role: newRole, companyId }),
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
      const res = await fetch(`/api/team/members?membershipId=${membershipId}&companyId=${companyId}`, {
        method: "DELETE",
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

  function closePinModal() {
    setShowPinModal(false);
    setGeneratedPin(null);
    setSelectedMember(null);
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

      {/* Add New Team Member */}
      {canManageTeam && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Team Member</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add team members who will access the system using a PIN on your work devices.
          </p>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={addMemberName}
                  onChange={(e) => setAddMemberName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (for reference only)</label>
                <input
                  type="email"
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={addMemberRole}
                onChange={(e) => setAddMemberRole(e.target.value as MemberRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="VIEWER">Viewer - Read-only access</option>
                <option value="EDITOR">Editor - Can create and edit content</option>
                <option value="ADMIN">Admin - Can manage team members</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add Team Member"}
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
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-semibold">
                        {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                      {member.pin && (
                        <p className="text-xs text-emerald-600 mt-1">✓ PIN assigned</p>
                      )}
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
                    <>
                      {member.pin ? (
                        <button
                          onClick={() => resetPin(member)}
                          className="text-orange-600 hover:text-orange-800 text-sm px-2 py-1 border border-orange-300 rounded"
                        >
                          Reset PIN
                        </button>
                      ) : (
                        <button
                          onClick={() => generatePin(member)}
                          className="text-emerald-600 hover:text-emerald-800 text-sm px-2 py-1 border border-emerald-300 rounded"
                        >
                          Generate PIN
                        </button>
                      )}
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </>
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

      {/* PIN Display Modal */}
      {showPinModal && generatedPin && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">PIN Generated</h3>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6 mb-4">
              <p className="text-sm text-gray-600 mb-2">PIN for {selectedMember.user.name}:</p>
              <p className="text-4xl font-bold text-emerald-600 tracking-widest text-center mb-2">
                {generatedPin}
              </p>
              <p className="text-xs text-gray-500 text-center">
                Save this PIN - it won't be shown again
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Write down this PIN and give it to {selectedMember.user.name}. 
                They will use it to access the system on your work devices.
              </p>
            </div>
            <button
              onClick={closePinModal}
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors"
            >
              I've Saved the PIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


