import { useEffect, useRef } from "react";

export interface ShortcutDefinition {
  /** Lowercase key, e.g. "k", "n", "s", "f", "escape" */
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** Allow firing while an input/textarea is focused */
  allowInInput?: boolean;
  handler: (e: KeyboardEvent) => void;
  description?: string;
}

const isEditable = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    node.isContentEditable === true
  );
};

/**
 * Central keyboard shortcut registry for the dashboard.
 * Shortcuts are declarative so future modules (Fase 3) can register their own
 * without duplicating listener logic.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[], enabled = true) {
  const ref = useRef(shortcuts);
  ref.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      for (const s of ref.current) {
        if (s.key.toLowerCase() !== key) continue;
        const ctrl = !!s.ctrl;
        if (ctrl !== (e.ctrlKey || e.metaKey)) continue;
        if (!!s.shift !== e.shiftKey) continue;
        if (!!s.alt !== e.altKey) continue;
        if (!s.allowInInput && isEditable(e.target)) continue;
        e.preventDefault();
        s.handler(e);
        break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

/** Human readable shortcut label, e.g. ⌘K / Ctrl+K */
export const shortcutLabel = (key: string, ctrl = false) => {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? "⌘" : "Ctrl+";
  return `${ctrl ? mod : ""}${key.toUpperCase()}`;
};
