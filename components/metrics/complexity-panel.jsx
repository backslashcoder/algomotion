import { Panel } from "@/components/layout/panel";

/** Theoretical complexity. Deliberately separate from observed metrics. */
export function ComplexityPanel({ complexity }) {
  const rows = [
    ["Best", complexity.time.best],
    ["Average", complexity.time.average],
    ["Worst", complexity.time.worst],
  ];
  return (
    <Panel
      title="Theoretical complexity"
      description="Asymptotic bounds, independent of the current input"
    >
      <table className="w-full text-sm">
        <caption className="sr-only">Time and space complexity</caption>
        <tbody className="divide-y">
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row" className="py-1.5 pr-4 text-left font-normal text-muted-foreground">
                Time · {label}
              </th>
              <td className="py-1.5 text-right font-mono font-semibold">{value}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="py-1.5 pr-4 text-left font-normal text-muted-foreground">
              Space
            </th>
            <td className="py-1.5 text-right font-mono font-semibold">{complexity.space}</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  );
}
