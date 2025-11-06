"use client";

import { useState, useEffect } from "react";
import { Permission } from "@/lib/permissions";

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  async function fetchPermissions() {
    try {
      const res = await fetch("/api/permissions/check");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoading(false);
    }
  }

  function hasPermission(permission: Permission): boolean {
    return permissions.includes(permission);
  }

  function hasAnyPermission(perms: Permission[]): boolean {
    return perms.some((p) => permissions.includes(p));
  }

  function hasAllPermissions(perms: Permission[]): boolean {
    return perms.every((p) => permissions.includes(p));
  }

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refresh: fetchPermissions,
  };
}

