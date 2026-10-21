import { Panel } from "@/components/layout/panel";

/** Observed execution metrics (cumulative up to the current step). */
export function MetricsPanel({ metrics: definitions, values }) {
  return (
    <Panel
      title="Observed on this input"
      description="Counts so far, up to the current step"
      data-testid="metrics"
    >
      <dl className="grid grid-cols-2 gap-2">
        {definitions.map((m) => (
          <div key={m.key} className="rounded-lg border bg-surface-2/50 px-3 py-2" title={m.description}>
            <dt className="text-xs text-muted-foreground">{m.label}</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums" data-metric={m.key}>
              {values?.[m.key] ?? 0}
            </dd>
          </div>
        ))}
      </dl>
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">What do these count?</summary>
        <ul className="mt-2 space-y-1.5">
          {definitions.map((m) => (
            <li key={m.key}>
              <span className="font-medium text-foreground">{m.label}:</span> {m.description}
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  );
}
