const swatchColor = (color) =>
  color ? `var(--viz-${color})` : "var(--viz-default-stroke)";

/**
 * Legend for visualization states. Each entry pairs a colour with a text label
 * (and a dashed outline when the state is also dashed in the drawing), so
 * meaning never depends on colour alone.
 */
export function VizLegend({ items }) {
  if (!items?.length) return null;
  return (
    <ul
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
      aria-label="Legend"
    >
      {items.map((item) => (
        <li key={item.role ?? item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-[3px] border-2"
            style={{
              borderColor: swatchColor(item.color),
              background: item.color
                ? `color-mix(in oklch, ${swatchColor(item.color)} 55%, transparent)`
                : "var(--viz-default)",
              borderStyle: item.dashed ? "dashed" : "solid",
            }}
          />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
