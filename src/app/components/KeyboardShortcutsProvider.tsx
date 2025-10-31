"use client";

import { useKeyboardShortcuts } from "../lib/hooks/useKeyboardShortcuts";
import { CommandPalette } from "./CommandPalette";
import { ShortcutsHelpModal } from "./ShortcutsHelpModal";

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return (
    <>
      {children}
      <CommandPalette />
      <ShortcutsHelpModal />
    </>
  );
}

