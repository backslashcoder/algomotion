"use client";

const summarise = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/**
 * Generic fallback renderer: lists the current state and focus as key/value
 * pairs. Any algorithm can use it (`visualization.type = "state-panel"`) before
 * a dedicated renderer exists, and it is used when a type is unknown.
 */
export function StatePanelRenderer({ frame }) {
  const entries = [
    ...Object.entries(frame.state),
    ...Object.entries(frame.step.focus ?? {}).map(([k, v]) => [`focus.${k}`, v]),
  ];
  return (
    <dl className="grid w-full gap-x-4 gap-y-2 font-mono text-sm sm:grid-cols-[max-content_1fr]">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="break-all">{summarise(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
