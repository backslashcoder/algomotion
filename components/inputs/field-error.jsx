import { AlertCircle } from "lucide-react";

/** Inline, accessible validation feedback (no browser alerts). */
export function FieldError({ id, messages }) {
  if (!messages?.length) return null;
  return (
    <div
      id={id}
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <ul className="space-y-0.5">
        {messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
