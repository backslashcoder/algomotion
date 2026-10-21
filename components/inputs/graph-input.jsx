"use client";

import { useId, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "./field-error";
import {
  GRAPH_PRESETS,
  parseEdgeList,
  parseNodeList,
} from "@/algorithms/graphs/bfs";

const edgesToText = (edges) => edges.map(([a, b]) => `${a}-${b}`).join(", ");

/** Editor for `{ nodes, edges, directed, start }` graph inputs. */
export function GraphInput({ definition, input, onApply, onReset }) {
  const id = useId();
  const [nodesText, setNodesText] = useState(input.nodes.join(", "));
  const [edgesText, setEdgesText] = useState(edgesToText(input.edges));
  const [start, setStart] = useState(input.start);
  const [directed, setDirected] = useState(input.directed);
  const [errors, setErrors] = useState([]);
  const { maxNodes, maxEdges } = definition.input.limits;

  const [syncedInput, setSyncedInput] = useState(input);
  if (syncedInput !== input) {
    setSyncedInput(input);
    setNodesText(input.nodes.join(", "));
    setEdgesText(edgesToText(input.edges));
    setStart(input.start);
    setDirected(input.directed);
    setErrors([]);
  }

  function applyDraft(event) {
    event.preventDefault();
    const nodes = parseNodeList(nodesText);
    if (!nodes.ok) return setErrors(nodes.errors);
    const edges = parseEdgeList(edgesText);
    if (!edges.ok) return setErrors(edges.errors);
    const res = onApply({ nodes: nodes.nodes, edges: edges.edges, directed, start });
    setErrors(res.ok ? [] : res.error.messages);
  }

  function loadPreset(preset) {
    const res = onApply(preset.value);
    setErrors(res.ok ? [] : res.error.messages);
  }

  const startOptions = parseNodeList(nodesText).nodes ?? input.nodes;

  return (
    <form onSubmit={applyDraft} className="space-y-3" noValidate>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Example graphs</legend>
        <div className="flex flex-wrap gap-2">
          {GRAPH_PRESETS.map((p) => (
            <Button key={p.id} type="button" variant="outline" size="lg" onClick={() => loadPreset(p)}>
              {p.label}
            </Button>
          ))}
          <Button type="button" variant="ghost" size="lg" onClick={onReset}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Default
          </Button>
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={`${id}-nodes`} className="text-sm font-medium">
          Nodes
        </label>
        <Input
          id={`${id}-nodes`}
          value={nodesText}
          onChange={(e) => setNodesText(e.target.value)}
          className="font-mono"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          Up to {maxNodes} names of 1–3 letters or digits.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${id}-edges`} className="text-sm font-medium">
          Edges
        </label>
        <Input
          id={`${id}-edges`}
          value={edgesText}
          onChange={(e) => setEdgesText(e.target.value)}
          className="font-mono"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={errors.length > 0}
          aria-describedby={`${id}-error`}
        />
        <p className="text-xs text-muted-foreground">
          Pairs like A-B, B-C (up to {maxEdges}). Isolated nodes need no edges.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-start`} className="block text-sm font-medium">
            Start node
          </label>
          <select
            id={`${id}-start`}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 font-mono text-sm"
          >
            {startOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={directed}
            onChange={(e) => setDirected(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Directed edges
        </label>
        <Button type="submit" size="lg">
          <Check data-icon="inline-start" aria-hidden="true" />
          Apply
        </Button>
      </div>
      <FieldError id={`${id}-error`} messages={errors} />
    </form>
  );
}
