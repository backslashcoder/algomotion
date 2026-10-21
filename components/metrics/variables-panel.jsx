import { Panel } from "@/components/layout/panel";

/** Named values and pointers for the current step. */
export function VariablesPanel({ variables }) {
  const entries = Object.entries(variables ?? {});
  return (
    <Panel title="Variables" data-testid="variables">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No variables at this step.
        </p>
      ) : (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 font-mono text-sm">
          {entries.map(([name, value]) => (
            <div key={name} className="contents">
              <dt className="text-muted-foreground">{name}</dt>
              <dd className="break-words text-primary">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  );
}
