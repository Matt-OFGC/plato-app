"use client";

import { useState, useEffect } from "react";
import { getAllPermissions, Permission } from "@/lib/permissions";
import PermissionCheckboxes from "./PermissionCheckboxes";

interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  permissions: Permission[];
}

interface RoleManagerProps {
  companyId: number;
}

export default function RoleManager({ companyId }: RoleManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as Permission[],
  });

  useEffect(() => {
    loadRoles();
  }, [companyId]);

  async function loadRoles() {
    try {
      const res = await fetch("/api/permissions/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Failed to load roles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const res = await fetch("/api/permissions/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          permissions: formData.permissions,
        }),
      });

      if (res.ok) {
        await loadRoles();
        setShowCreateForm(false);
        setFormData({ name: "", description: "", permissions: [] });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create role");
      }
    } catch (error) {
      console.error("Failed to create role:", error);
      alert("Failed to create role");
    }
  }

  async function handleUpdate() {
    if (!editingRole) return;

    try {
      const res = await fetch(`/api/permissions/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          permissions: formData.permissions,
        }),
      });

      if (res.ok) {
        await loadRoles();
        setEditingRole(null);
        setFormData({ name: "", description: "", permissions: [] });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role");
    }
  }

  async function handleDelete(roleId: number) {
    if (!confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      const res = await fetch(`/api/permissions/roles/${roleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadRoles();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete role");
      }
    } catch (error) {
      console.error("Failed to delete role:", error);
      alert("Failed to delete role");
    }
  }

  function startEdit(role: Role) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions,
    });
    setShowCreateForm(false);
  }

  function cancelEdit() {
    setEditingRole(null);
    setFormData({ name: "", description: "", permissions: [] });
    setShowCreateForm(false);
  }

  if (loading) {
    return <div className="text-center py-8">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(showCreateForm || editingRole) && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingRole ? "Edit Role" : "Create New Role"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Manager, Supervisor, Staff Member"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Describe what this role can do"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <PermissionCheckboxes
                selectedPermissions={formData.permissions}
                onChange={(permissions) =>
                  setFormData({ ...formData, permissions })
                }
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={editingRole ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingRole ? "Update Role" : "Create Role"}
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Roles</h2>
          {!showCreateForm && !editingRole && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Role
            </button>
          )}
        </div>

        <div className="space-y-4">
          {roles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No roles found. Create your first role to get started.
            </p>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {role.name}
                      </h3>
                      {role.isSystemRole && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          System Role
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {role.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {role.permissions.length} permission
                      {role.permissions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!role.isSystemRole && (
                      <>
                        <button
                          onClick={() => startEdit(role)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

