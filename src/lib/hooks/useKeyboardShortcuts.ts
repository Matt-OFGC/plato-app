'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  const shortcuts: KeyboardShortcut[] = [
    // Command Palette (⌘K or Ctrl+K)
    {
      key: 'k',
      metaKey: true,
      action: () => {
        // Will be handled by CommandPalette component
        const event = new CustomEvent('open-command-palette');
        window.dispatchEvent(event);
      },
      description: 'Open command palette',
      preventDefault: true,
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        const event = new CustomEvent('open-command-palette');
        window.dispatchEvent(event);
      },
      description: 'Open command palette',
      preventDefault: true,
    },
    // Navigation shortcuts
    {
      key: 'n',
      metaKey: true,
      action: () => {
        if (pathname?.startsWith('/dashboard/recipes')) {
          router.push('/dashboard/recipes/new');
        } else {
          router.push('/dashboard/recipes/new');
        }
      },
      description: 'New recipe',
      preventDefault: true,
    },
    {
      key: 'i',
      metaKey: true,
      action: () => {
        router.push('/dashboard/ingredients/new');
      },
      description: 'New ingredient',
      preventDefault: true,
    },
    // Toggle sidebar (⌘B or Ctrl+B)
    {
      key: 'b',
      metaKey: true,
      action: () => {
        const event = new CustomEvent('toggle-sidebar');
        window.dispatchEvent(event);
      },
      description: 'Toggle sidebar',
      preventDefault: true,
    },
    {
      key: 'b',
      ctrlKey: true,
      action: () => {
        const event = new CustomEvent('toggle-sidebar');
        window.dispatchEvent(event);
      },
      description: 'Toggle sidebar',
      preventDefault: true,
    },
    // Shortcuts help (⌘? or Ctrl+Shift+?)
    {
      key: '?',
      metaKey: true,
      shiftKey: false,
      action: () => {
        const event = new CustomEvent('open-shortcuts-help');
        window.dispatchEvent(event);
      },
      description: 'Show keyboard shortcuts',
      preventDefault: true,
    },
    {
      key: '?',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        const event = new CustomEvent('open-shortcuts-help');
        window.dispatchEvent(event);
      },
      description: 'Show keyboard shortcuts',
      preventDefault: true,
    },
    // Dashboard navigation
    {
      key: 'g',
      metaKey: true,
      shiftKey: false,
      action: () => {
        router.push('/dashboard');
      },
      description: 'Go to dashboard',
      preventDefault: true,
    },
    {
      key: 'g',
      ctrlKey: true,
      action: () => {
        router.push('/dashboard');
      },
      description: 'Go to dashboard',
      preventDefault: true,
    },
    // Undo/Redo
    {
      key: 'z',
      metaKey: true,
      shiftKey: false,
      action: () => {
        window.dispatchEvent(new CustomEvent('undo-action'));
      },
      description: 'Undo',
      preventDefault: true,
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: false,
      action: () => {
        window.dispatchEvent(new CustomEvent('undo-action'));
      },
      description: 'Undo',
      preventDefault: true,
    },
    {
      key: 'z',
      metaKey: true,
      shiftKey: true,
      action: () => {
        window.dispatchEvent(new CustomEvent('redo-action'));
      },
      description: 'Redo',
      preventDefault: true,
    },
    {
      key: 'y',
      metaKey: true,
      action: () => {
        window.dispatchEvent(new CustomEvent('redo-action'));
      },
      description: 'Redo',
      preventDefault: true,
    },
    {
      key: 'y',
      ctrlKey: true,
      action: () => {
        window.dispatchEvent(new CustomEvent('redo-action'));
      },
      description: 'Redo',
      preventDefault: true,
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      (target.tagName === 'SELECT')
    ) {
      // Allow ⌘K / Ctrl+K even in inputs for command palette
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        // Continue with shortcut
      } else {
        return;
      }
    }

    // Find matching shortcut
    const shortcut = shortcuts.find((s) => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const metaMatch = s.metaKey ? event.metaKey : !event.metaKey;
      const ctrlMatch = s.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const shiftMatch = s.shiftKey === undefined ? true : s.shiftKey === event.shiftKey;
      const altMatch = s.altKey === undefined ? true : s.altKey === event.altKey;

      return keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch;
    });

    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.action();
    }
  }, [shortcuts, router, pathname]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

