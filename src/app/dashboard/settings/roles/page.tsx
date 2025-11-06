import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { canManageTeam } from "@/lib/permissions";
import RoleManagerClient from "./components/RoleManager";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login?redirect=/dashboard/settings/roles");
  }

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) {
    redirect("/dashboard");
  }

  // Check permission
  const canManage = await canManageTeam(user.id, companyId);
  if (!canManage) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        <p className="text-gray-600 mt-2">
          Create and manage custom roles with granular permissions
        </p>
      </div>

      <RoleManagerClient companyId={companyId} />
    </div>
  );
}

