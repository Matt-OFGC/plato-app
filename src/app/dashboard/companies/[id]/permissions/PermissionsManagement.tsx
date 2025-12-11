"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Membership {
  id: number;
  userId: number;
  role: string;
  isActive: boolean;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
}

interface Props {
  companyId: number;
  memberships: Membership[];
  currentUserRole: string;
  currentUserId: number;
}

const ROLE_PERMISSIONS: Record<string, {
  label: string;
  description: string;
  permissions: string[];
}> = {
  OWNER: {
    label: "Owner",
    description: "Full access to all company features and settings",
    permissions: [
      "manage:company",
      "manage:team",
      "manage:recipes",
      "manage:ingredients",
      "view:analytics",
      "manage:billing",
      "export:data",
    ],
  },
  ADMIN: {
    label: "Admin",
    description: "Can manage team, recipes, and most settings",
    permissions: [
      "manage:team",
      "manage:recipes",
      "manage:ingredients",
      "view:analytics",
      "export:data",
    ],
  },
  EMPLOYEE: {
    label: "Employee",
    description: "Can view and edit recipes and ingredients",
    permissions: [
      "manage:recipes",
      "manage:ingredients",
      "view:analytics",
    ],
  },
  VIEWER: {
    label: "Viewer",
    description: "Read-only access to recipes and ingredients",
    permissions: [
      "view:recipes",
      "view:ingredients",
    ],
  },
};

export function PermissionsManagement({
  companyId,
  memberships,
  currentUserRole,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<number, string>>({});

  const handleRoleChange = async (membershipId: number, newRole: string) => {
    if (newRole === "OWNER" && currentUserRole !== "OWNER") {
      alert("Only owners can assign the owner role");
      return;
    }

    setUpdating(membershipId);
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          membershipId,
          role: newRole,
        }),
      });

      if (res.ok) {
        router.refresh();
        setSelectedRole({});
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const canManageRole = (targetRole: string) => {
    if (currentUserRole === "OWNER") return true;
    if (currentUserRole === "ADMIN" && targetRole !== "OWNER") return true;
    return false;
  };

  return (
    <div className="app-container">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Permissions</h1>
            <p className="text-gray-600 mt-2">Manage roles and permissions for team members</p>
          </div>
          <a
            href={`/dashboard/companies/${companyId}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Company
          </a>
        </div>
      </div>

      {/* Role Permissions Reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(ROLE_PERMISSIONS).map(([role, info]) => (
            <div key={role} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{info.label}</h3>
              <p className="text-sm text-gray-600 mb-3">{info.description}</p>
              <ul className="space-y-1">
                {info.permissions.map((perm) => (
                  <li key={perm} className="text-xs text-gray-600 flex items-center gap-1">
                    <svg
                      className="w-3 h-3 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            {memberships.length} active member{memberships.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {memberships.map((membership) => {
            const isCurrentUser = membership.userId === currentUserId;
            const canManage = canManageRole(membership.role);

            return (
              <div
                key={membership.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  isCurrentUser ? "bg-emerald-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {membership.user.name || membership.user.email}
                      </h3>
                      {isCurrentUser && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                          You
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded capitalize ${
                          membership.role === "OWNER"
                            ? "bg-purple-100 text-purple-700"
                            : membership.role === "ADMIN"
                            ? "bg-blue-100 text-blue-700"
                            : membership.role === "EMPLOYEE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {membership.role.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{membership.user.email}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Permissions: {ROLE_PERMISSIONS[membership.role]?.permissions.join(", ") || "None"}
                    </div>
                  </div>
                  {canManage && !isCurrentUser && (
                    <select
                      value={selectedRole[membership.id] || membership.role}
                      onChange={(e) => {
                        setSelectedRole({ ...selectedRole, [membership.id]: e.target.value });
                        handleRoleChange(membership.id, e.target.value);
                      }}
                      disabled={updating === membership.id}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {Object.keys(ROLE_PERMISSIONS).map((role) => (
                        <option key={role} value={role}>
                          {ROLE_PERMISSIONS[role].label}
                        </option>
                      ))}
                    </select>
                  )}
                  {isCurrentUser && (
                    <span className="text-sm text-gray-500">Your role</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
