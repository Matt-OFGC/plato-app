"use client";

import Link from "next/link";
import { useState } from "react";
import { SmartImporter } from "@/components/SmartImporter";
import { InvoiceScanner } from "@/components/InvoiceScanner";
import { useRouter } from "next/navigation";

export function IngredientsPageClient() {
  const [showInvoiceScanner, setShowInvoiceScanner] = useState(false);
  const router = useRouter();

  const handleIngredientsExtracted = async (ingredients: any[]) => {
    try {
      // Create ingredients in batch
      const response = await fetch("/api/ingredients/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients }),
      });

      if (!response.ok) {
        throw new Error("Failed to create ingredients");
      }

      // Refresh the page to show new ingredients
      router.refresh();
    } catch (error) {
      console.error("Error creating ingredients:", error);
      alert("Failed to import ingredients. Please try again.");
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <SmartImporter type="ingredients" />
        <button
          onClick={() => setShowInvoiceScanner(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Scan Invoice
        </button>
        <Link href="/dashboard/ingredients/new" className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ingredient
        </Link>
      </div>

      {showInvoiceScanner && (
        <InvoiceScanner
          onIngredientsExtracted={handleIngredientsExtracted}
          onClose={() => setShowInvoiceScanner(false)}
        />
      )}
    </>
  );
}
