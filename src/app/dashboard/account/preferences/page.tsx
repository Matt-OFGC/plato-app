import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { UserPreferences } from "@/components/UserPreferences";

export const dynamic = 'force-dynamic';

export default async function PreferencesPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Preferences</h1>
        <p className="text-gray-500 text-lg mb-6">Customize defaults, display options, and notifications to match your workflow</p>
      </div>

      {/* Preferences Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <UserPreferences />
      </div>
    </div>
  );
}



