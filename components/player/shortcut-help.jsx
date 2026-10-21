import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  ["Space", "Play / pause"],
  ["←  →", "Previous / next step"],
  ["Home  End", "First / last step"],
];

/** Always-available keyboard shortcut reference (a plain disclosure, no JS needed). */
export function ShortcutHelp() {
  return (
    <details className="group text-xs text-muted-foreground">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md px-1 py-0.5 hover:text-foreground">
        <Keyboard className="size-3.5" aria-hidden="true" />
        Keyboard shortcuts
      </summary>
      <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
        {SHORTCUTS.map(([keys, action]) => (
          <div key={keys} className="contents">
            <dt>
              <kbd className="rounded border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                {keys}
              </kbd>
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
