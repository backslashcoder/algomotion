import { cn } from "@/lib/utils";

/** Consistent surface for workspace sections. */
export function Panel({ title, description, action, children, className, as: Tag = "section", ...props }) {
  return (
    <Tag
      className={cn("rounded-xl border bg-surface", className)}
      {...props}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </Tag>
  );
}
