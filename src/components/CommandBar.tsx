"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";

interface CommandBarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandBar({ open, setOpen }: CommandBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <Command
          className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center border-b px-3">
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
            <Command.Input
              value={search}
              onValueChange={setSearch}
              className="flex-1 px-3 py-3 bg-transparent border-0 outline-none text-sm placeholder-gray-400"
              placeholder="Type a command or search..."
            />
            <kbd className="px-2 py-1 text-xs bg-gray-100 rounded text-gray-600">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Quick Actions" className="text-xs font-semibold text-gray-500 px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/recipes/new"))}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Recipe
                <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-gray-100 rounded">N</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/ingredients/new"))}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Ingredient
                <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-gray-100 rounded">I</kbd>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-gray-200 my-2" />

            <Command.Group heading="Navigation" className="text-xs font-semibold text-gray-500 px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/recipes"))}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Recipes
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/ingredients"))}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Ingredients
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/team"))}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Team
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/account"))}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-gray-200 my-2" />

            <Command.Group heading="Admin" className="text-xs font-semibold text-gray-500 px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/system-admin/dashboard"))}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                System Admin
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↑</kbd>{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↓</kbd> to navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↵</kbd> to select
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

