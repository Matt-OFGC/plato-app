"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { usePageActions } from "@/components/PageActionContext";

interface RecipesPageClientProps {
  children: ReactNode;
}

export function RecipesPageClient({ children }: RecipesPageClientProps) {
  const router = useRouter();
  const { registerNewAction, unregisterNewAction } = usePageActions();

  // Register the new recipe action when component mounts
  useEffect(() => {
    const handleNewRecipe = () => {
      router.push("/dashboard/recipes/new");
    };
    registerNewAction(handleNewRecipe);
    return () => {
      unregisterNewAction();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
