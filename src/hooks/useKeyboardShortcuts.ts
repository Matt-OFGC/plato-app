"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Don't trigger if modifier keys are pressed (except for specific combos)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          router.push("/dashboard/recipes/new");
          break;
        case "i":
          e.preventDefault();
          router.push("/dashboard/ingredients/new");
          break;
        case "p":
          e.preventDefault();
          router.push("/dashboard/production");
          break;
        case "m":
          e.preventDefault();
          router.push("/dashboard/recipe-mixer");
          break;
        case "h":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "r":
          e.preventDefault();
          router.push("/dashboard/recipes");
          break;
        case "t":
          e.preventDefault();
          router.push("/dashboard/team");
          break;
        case "?":
          e.preventDefault();
          // Show keyboard shortcuts help modal
          alert(
            "Keyboard Shortcuts:\n\n" +
            "N - New Recipe\n" +
            "I - New Ingredient\n" +
            "P - Production Planning\n" +
            "M - Recipe Mixer\n" +
            "H - Home/Dashboard\n" +
            "R - Recipes List\n" +
            "T - Team\n" +
            "⌘K - Command Bar\n" +
            "? - This help"
          );
          break;
      }
    }

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [router]);
}

