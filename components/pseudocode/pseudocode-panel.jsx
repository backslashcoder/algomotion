import { Panel } from "@/components/layout/panel";
import { cn } from "@/lib/utils";

/** Pseudocode with the line for the current event highlighted (matched by stable line id). */
export function PseudocodePanel({ lines, activeLine }) {
  return (
    <Panel title="Pseudocode" className="overflow-hidden" data-testid="pseudocode">
      <ol className="-mx-4 -my-4 py-2 font-mono text-[13px] leading-6">
        {lines.map((line, i) => {
          const active = line.id === activeLine;
          return (
            <li
              key={line.id}
              data-line={line.id}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex border-l-2 pr-4 transition-all duration-300",
                active
                  ? "border-primary bg-primary/15 pl-1 text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              <span className="w-9 shrink-0 select-none pr-2 text-right text-xs leading-6 opacity-60">
                {i + 1}
              </span>
              <span
                className="whitespace-pre-wrap"
                style={{ paddingLeft: `${line.indent * 1.1}rem` }}
              >
                {line.text}
              </span>
              {active && <span className="sr-only"> (current step)</span>}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
