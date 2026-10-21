"use client";

import { useMemo } from "react";
import { computeGraphLayout } from "./layout";
import { VizLegend } from "../shared/legend";
import { cn } from "@/lib/utils";

const WIDTH = 620;
const HEIGHT = 400;
const R = 24;

const NODE_LEGEND = [
  { role: "unvisited", label: "Unvisited", color: null },
  { role: "queued", label: "Discovered (in queue)", color: "compare", dashed: true },
  { role: "current", label: "Current", color: "active" },
  { role: "visited", label: "Visited", color: "done" },
];

function nodeStyle(status) {
  switch (status) {
    case "queued":
      return { fill: "color-mix(in oklch, var(--viz-compare) 30%, var(--surface))", stroke: "var(--viz-compare)", width: 3, dash: "5 3" };
    case "current":
      return { fill: "color-mix(in oklch, var(--viz-active) 40%, var(--surface))", stroke: "var(--viz-active)", width: 4 };
    case "visited":
      return { fill: "color-mix(in oklch, var(--viz-done) 45%, var(--surface))", stroke: "var(--viz-done)", width: 3 };
    default:
      return { fill: "var(--viz-default)", stroke: "var(--viz-default-stroke)", width: 1.5 };
  }
}

/** Shorten a segment so it ends at the circle's edge. */
function trim(from, to, gap) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: to.x - (dx / len) * gap, y: to.y - (dy / len) * gap };
}

/** Graph renderer (traversals). Reads only `state` + `focus`. */
export function GraphRenderer({ frame, transitionMs = 300 }) {
  const { state, step } = frame;
  const focus = step.focus ?? {};
  const { graph, status, queue, order, dist, treeEdges } = state;

  const positions = useMemo(
    () => computeGraphLayout(graph, { width: WIDTH, height: HEIGHT }),
    [graph],
  );

  const isTreeEdge = (a, b) =>
    treeEdges.some(([x, y]) => (x === a && y === b) || (!graph.directed && x === b && y === a));
  const examining = focus.examining;
  const isExamining = (a, b) =>
    examining &&
    ((examining[0] === a && examining[1] === b) ||
      (!graph.directed && examining[0] === b && examining[1] === a));

  const transition = { transitionDuration: `${transitionMs}ms` };

  return (
    <div className="flex w-full flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges. Visited: ${order.join(", ") || "none"}. Queue: ${queue.join(", ") || "empty"}.`}
      >
        <defs>
          {["default", "tree", "active"].map((kind) => (
            <marker
              key={kind}
              id={`arrow-${kind}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M0 0 L10 5 L0 10 Z"
                fill={kind === "tree" ? "var(--viz-done)" : kind === "active" ? "var(--viz-active)" : "var(--viz-default-stroke)"}
              />
            </marker>
          ))}
        </defs>

        {graph.edges.map(([a, b]) => {
          // tree edges are drawn parent → child so the line "grows" in the direction of discovery
          const treePair = treeEdges.find(
            ([x, y]) => (x === a && y === b) || (!graph.directed && x === b && y === a),
          );
          const from = treePair ? treePair[0] : a;
          const to = treePair ? treePair[1] : b;
          const pa = positions[from];
          const pb = positions[to];
          const kind = isExamining(a, b) ? "active" : isTreeEdge(a, b) ? "tree" : "default";
          const end = graph.directed ? trim(pa, pb, R + 3) : pb;
          const tree = kind === "tree";
          const active = kind === "active";
          return (
            <line
              // re-mount when the edge changes role so its entrance animation plays
              key={`${a}-${b}-${kind}`}
              x1={pa.x}
              y1={pa.y}
              x2={end.x}
              y2={end.y}
              pathLength={tree ? 1 : undefined}
              className={cn(tree && "viz-draw", active && "viz-march")}
              stroke={active ? "var(--viz-active)" : tree ? "var(--viz-done)" : "var(--viz-default-stroke)"}
              strokeWidth={kind === "default" ? 2 : 4}
              strokeDasharray={active ? "8 5" : undefined}
              strokeLinecap="round"
              style={tree ? { animationDuration: `${Math.max(transitionMs, 1) * 1.4}ms` } : undefined}
              markerEnd={graph.directed ? `url(#arrow-${kind})` : undefined}
            />
          );
        })}

        {graph.nodes.map((id, index) => {
          const { x, y } = positions[id];
          const current = focus.current === id;
          const st = nodeStyle(current ? "current" : status[id]);
          const isStart = graph.start === id;
          return (
            <g key={id} transform={`translate(${x}, ${y})`}>
              {current && (
                <circle
                  r={R + 6}
                  fill="none"
                  stroke="var(--viz-active)"
                  strokeWidth={3}
                  className="viz-ring"
                />
              )}
              {/* re-mounted when the node's status changes, so it pops into its new state */}
              <g
                key={current ? "current" : status[id]}
                className="viz-pop"
                style={{ animationDelay: step.type === "init" ? `${index * 45}ms` : undefined }}
              >
                <circle
                  r={R}
                  fill={st.fill}
                  stroke={st.stroke}
                  strokeWidth={st.width}
                  strokeDasharray={st.dash}
                />
              </g>
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize={16}
                fontWeight={700}
                fill="var(--viz-label)"
                className="font-mono"
              >
                {id}
              </text>
              {status[id] === "visited" && !current && (
                <g transform={`translate(${R * 0.7}, ${-R * 0.7})`} aria-hidden="true">
                  <circle r={9} fill="var(--viz-done)" />
                  <path d="M-4 0 L-1 3 L4 -3" fill="none" stroke="var(--background)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {isStart && (
                <text y={-R - 8} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--muted-foreground)">
                  start
                </text>
              )}
              {dist[id] !== undefined && (
                <text y={R + 16} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)" className="font-mono">
                  d={dist[id]}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="grid gap-3 sm:grid-cols-2">
        <Strip label="Queue" hint="front → back" items={queue} empty="empty" tone="compare" />
        <Strip label="Traversal order" items={order} empty="nothing visited yet" tone="done" arrows />
      </div>

      <VizLegend items={NODE_LEGEND} />
    </div>
  );
}

function Strip({ label, hint, items, empty, tone, arrows }) {
  return (
    <div className="rounded-lg border bg-surface-2/60 px-3 py-2">
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
      <ol className="flex min-h-8 flex-wrap items-center gap-1.5" aria-label={label}>
        {items.length === 0 && <li className="text-xs text-muted-foreground">{empty}</li>}
        {items.map((id, i) => (
          <li key={id} className="viz-pop flex items-center gap-1.5">
            <span
              className="inline-flex size-8 items-center justify-center rounded-md border-2 font-mono text-sm font-semibold"
              style={{
                borderColor: `var(--viz-${tone})`,
                background: `color-mix(in oklch, var(--viz-${tone}) 25%, transparent)`,
              }}
            >
              {id}
            </span>
            {arrows && i < items.length - 1 && (
              <span aria-hidden="true" className="text-muted-foreground">→</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
