"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface RecipeTrainingSectionProps {
  recipeId: number;
  companyId: number;
}

export function RecipeTrainingSection({
  recipeId,
  companyId,
}: RecipeTrainingSectionProps) {
  const [trainingModule, setTrainingModule] = useState<any>(null);
  const [staffCompletions, setStaffCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    loadTrainingData();
  }, [recipeId]);

  async function loadTrainingData() {
    try {
      // Get recipe relations to find training modules
      const relationsRes = await fetch(`/api/recipes/${recipeId}/relations`);
      if (relationsRes.ok) {
        const relationsData = await relationsRes.json();
        const trainingRelation = relationsData.relations?.find(
          (r: any) => r.type === "training"
        );

        if (trainingRelation) {
          // Get training module details
          const moduleRes = await fetch(
            `/api/training/modules/${trainingRelation.id}`
          );
          if (moduleRes.ok) {
            const moduleData = await moduleRes.json();
            setTrainingModule(moduleData.module);

            // Get staff completion records
            const recordsRes = await fetch(
              `/api/training/records?moduleId=${trainingRelation.id}&status=completed`
            );
            if (recordsRes.ok) {
              const recordsData = await recordsRes.json();
              setStaffCompletions(recordsData.records || []);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load training data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Loading training information...</p>
      </div>
    );
  }

  if (!trainingModule) {
    return null; // No training module linked
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Training Module
        </h3>
        <Link
          href={`/dashboard/training/modules/${trainingModule.id}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          View Training
        </Link>
      </div>

      <p className="text-sm text-gray-600 mb-4">{trainingModule.description}</p>

      {trainingModule.estimatedDuration && (
        <p className="text-sm text-gray-500 mb-4">
          Estimated duration: {trainingModule.estimatedDuration} minutes
        </p>
      )}

      {hasPermission("training:view") && staffCompletions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Staff Qualifications ({staffCompletions.length})
          </h4>
          <div className="space-y-1">
            {staffCompletions.slice(0, 5).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">
                  {record.membership.user.name || record.membership.user.email}
                </span>
                <Link
                  href={`/dashboard/team/${record.membershipId}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View Profile
                </Link>
              </div>
            ))}
            {staffCompletions.length > 5 && (
              <p className="text-xs text-gray-500 mt-2">
                +{staffCompletions.length - 5} more qualified staff members
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

