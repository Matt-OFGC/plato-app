"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";
import { isCommandVisible } from "@/lib/mvp-config";

interface Command {
  id: string;
  label: string;
  category: string;
  action: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toAppRoute } = useAppAwareRoute();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Create and filter commands based on MVP mode
  const commands = useMemo(() => {
    const allCommands: Command[] = [
      // Navigation
      {
        id: "dashboard",
        label: "Go to Dashboard",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard")),
        shortcut: "⌘G",
      },
      {
        id: "recipes",
        label: "Go to Recipes",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard/recipes")),
      },
      {
        id: "ingredients",
        label: "Go to Ingredients",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard/ingredients")),
      },
      {
        id: "production",
        label: "Go to Production",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard/production")),
      },
      {
        id: "analytics",
        label: "Go to Analytics",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard/analytics")),
      },
      {
        id: "team",
        label: "Go to Team",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard/team")),
      },
      {
        id: "scheduling",
        label: "Go to Scheduling",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard/scheduling")),
      },
      {
        id: "wholesale",
        label: "Go to Wholesale",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard/wholesale")),
      },
      {
        id: "messages",
        label: "Go to Messages",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard/messages")),
      },
      {
        id: "account",
        label: "Go to Account Settings",
        category: "Navigation",
        action: () => router.push(toAppRoute("/dashboard/account")),
      },
      // Actions
      {
        id: "new-recipe",
        label: "New Recipe",
        category: "Actions",
        action: () => router.push(toAppRoute("/dashboard/recipes/new")),
        shortcut: "⌘N",
      },
      {
        id: "new-ingredient",
        label: "New Ingredient",
        category: "Actions",
        action: () => router.push(toAppRoute("/dashboard/ingredients/new")),
        shortcut: "⌘I",
      },
      // Settings
      {
        id: "toggle-theme",
        label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
        category: "Settings",
        action: () => setTheme(theme === "dark" ? "light" : "dark"),
      },
      {
        id: "shortcuts-help",
        label: "Show Keyboard Shortcuts",
        category: "Settings",
        action: () => {
          setIsOpen(false);
          const event = new CustomEvent("open-shortcuts-help");
          window.dispatchEvent(event);
        },
        shortcut: "⌘?",
      },
    ];

    // Filter commands based on MVP mode
    return allCommands.filter(cmd => isCommandVisible(cmd.id));
  }, [theme, router, toAppRoute, setTheme]);

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSearchQuery("");
      setSelectedIndex(0);
    };

    window.addEventListener("open-command-palette", handleOpen);
    return () => window.removeEventListener("open-command-palette", handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    // Scroll selected item into view
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.querySelector(
        `[data-command-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {Object.entries(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd, idx) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      data-command-index={globalIndex}
                      onClick={() => {
                        cmd.action();
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedIndex === globalIndex
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100"
                          : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="text-sm font-medium">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

