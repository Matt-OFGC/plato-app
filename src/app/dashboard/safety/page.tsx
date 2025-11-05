import { SafetyPageClient } from "./SafetyPageClient";

export const dynamic = "force-dynamic";

export default async function SafetyPage() {
  try {
    return <SafetyPageClient />;
  } catch (error: any) {
    console.error("Safety page error:", error);
    // Return error UI instead of crashing
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Safety Module Initialization</h2>
          <p className="text-yellow-800">
            The Safety module is being set up. If you see this message, please run the database migration:
          </p>
          <code className="block mt-2 p-2 bg-yellow-100 rounded text-sm">
            npx tsx src/app/scripts/add-temperature-storage.ts
          </code>
        </div>
      </div>
    );
  }
}

