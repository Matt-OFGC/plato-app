"use client";

import { Permission, getAllPermissions } from "@/lib/permissions";

interface PermissionCheckboxesProps {
  selectedPermissions: Permission[];
  onChange: (permissions: Permission[]) => void;
}

export default function PermissionCheckboxes({
  selectedPermissions,
  onChange,
}: PermissionCheckboxesProps) {
  const allPermissions = getAllPermissions();

  // Group permissions by category
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const [category] = perm.split(":");
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  function togglePermission(permission: Permission) {
    if (selectedPermissions.includes(permission)) {
      onChange(selectedPermissions.filter((p) => p !== permission));
    } else {
      onChange([...selectedPermissions, permission]);
    }
  }

  function toggleCategory(category: string) {
    const categoryPerms = groupedPermissions[category];
    const allSelected = categoryPerms.every((p) =>
      selectedPermissions.includes(p)
    );

    if (allSelected) {
      // Deselect all in category
      onChange(
        selectedPermissions.filter((p) => !categoryPerms.includes(p))
      );
    } else {
      // Select all in category
      const newPerms = [
        ...selectedPermissions.filter((p) => !categoryPerms.includes(p)),
        ...categoryPerms,
      ];
      onChange(newPerms);
    }
  }

  function getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      staff: "Staff Management",
      training: "Training",
      production: "Production",
      cleaning: "Cleaning Jobs",
      financial: "Financial",
      recipes: "Recipes",
      ingredients: "Ingredients",
      timesheets: "Timesheets",
      scheduling: "Scheduling",
      settings: "Settings",
      team: "Team",
      billing: "Billing",
    };
    return names[category] || category;
  }

  function getPermissionDisplayName(permission: Permission): string {
    const [, action] = permission.split(":");
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([category, perms]) => {
          const categorySelected = perms.every((p) =>
            selectedPermissions.includes(p)
          );
          const someSelected = perms.some((p) =>
            selectedPermissions.includes(p)
          );

          return (
            <div key={category} className="border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={categorySelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !categorySelected;
                  }}
                  onChange={() => toggleCategory(category)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="font-semibold text-gray-900">
                  {getCategoryDisplayName(category)}
                </label>
              </div>
              <div className="ml-6 space-y-1">
                {perms.map((perm) => (
                  <div key={perm} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">
                      {getPermissionDisplayName(perm)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

