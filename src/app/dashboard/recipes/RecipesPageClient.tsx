"use client";

import Link from "next/link";
import { useState } from "react";
import { SmartImporter } from "@/components/SmartImporter";
import { MenuScanner } from "@/components/MenuScanner";
import { useRouter } from "next/navigation";

export function RecipesPageClient() {
  const [showMenuScanner, setShowMenuScanner] = useState(false);
  const router = useRouter();

  const handleRecipesExtracted = async (recipes: any[]) => {
    try {
      // Create recipes in batch
      const response = await fetch("/api/recipes/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipes }),
      });

      if (!response.ok) {
        throw new Error("Failed to create recipes");
      }

      // Refresh the page to show new recipes
      router.refresh();
    } catch (error) {
      console.error("Error creating recipes:", error);
      alert("Failed to import recipes. Please try again.");
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <SmartImporter type="recipes" />
        <button
          onClick={() => setShowMenuScanner(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Scan Menu
        </button>
        <Link href="/dashboard/recipes/new" className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Recipe
        </Link>
      </div>

      {showMenuScanner && (
        <MenuScanner
          onRecipesExtracted={handleRecipesExtracted}
          onClose={() => setShowMenuScanner(false)}
        />
      )}
    </>
  );
}
