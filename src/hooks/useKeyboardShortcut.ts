import { useEffect } from 'react';

interface ShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  onKeyDown: (e: KeyboardEvent) => void;
}

export const useKeyboardShortcut = (options: ShortcutOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (
        e.key.toLowerCase() === options.key.toLowerCase() &&
        (options.ctrlKey === undefined || e.ctrlKey === options.ctrlKey) &&
        (options.metaKey === undefined || e.metaKey === options.metaKey) &&
        (options.shiftKey === undefined || e.shiftKey === options.shiftKey) &&
        (options.altKey === undefined || e.altKey === options.altKey)
      ) {
        e.preventDefault();
        options.onKeyDown(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
};
