"use client";

import { useMemo } from "react";
import { ROLE_STYLES, barRatio, resolveRoles } from "./roles";
import { VizLegend } from "../shared/legend";
import { cn } from "@/lib/utils";

const MAX_WIDTH = 800;
const PAD = 24;

const colorVar = (name) => `var(--viz-${name})`;

function roleStyle(role) {
  const def = ROLE_STYLES[role] ?? ROLE_STYLES.default;
  return {
    fill: def.color ? colorVar(def.color) : "var(--viz-default)",
    stroke: def.color ? colorVar(def.color) : "var(--viz-default-stroke)",
    fillOpacity: def.color ? (def.faded ? 0.5 : def.soft ? 0.5 : 0.85) : 1,
    strokeWidth: def.heavy ? 3 : def.dashed ? 2.5 : 1.5,
    dash: def.dashed ? "6 4" : undefined,
    opacity: def.faded ? 0.55 : 1,
  };
}

const LEGENDS = {
  bars: ["compare", "swap", "key", "sorted"],
  cells: ["active", "compare", "eliminated", "found"],
};

const LEGEND_LABELS = {
  window: "In window",
  best: "Best",
  placed: "Placed",
  compare: "Comparing",
  swap: "Swapping / moving",
  key: "Key (selected)",
  active: "Focus / midpoint",
  eliminated: "Eliminated",
  found: "Found",
};

/** Roles that glow while they are the current focus of a step. */
const GLOWING = new Set(["compare", "active", "key", "swap", "shift", "take"]);
/** Roles that take part in the completion wave. */
const CELEBRATING = new Set(["sorted", "found", "best", "placed"]);

/**
 * Presentation-only motion hint for index `i`: elements that swap or shift hop
 * along an arc while sliding. Derived purely from the step's focus, never from history.
 */
function hopFor(i, focus) {
  const pair = Array.isArray(focus.swapping) ? [...focus.swapping].sort((a, b) => a - b) : [];
  if (pair.length === 2) {
    if (i === pair[0]) return "hop-up";
    if (i === pair[1]) return "hop-down";
  }
  if (Array.isArray(focus.shifting) && focus.shifting.includes(i)) return "hop-up";
  return null;
}

/**
 * Renders the array family: sorting bars and search cells.
 * It only reads `state` + `focus`; it never knows which algorithm produced them.
 * All motion is CSS driven by the current frame, so logical state never depends on animation.
 */
export function ArrayRenderer({ frame, config = {}, transitionMs = 300 }) {
  const { state, step } = frame;
  const focus = step.focus ?? {};
  const items = state.items;
  const n = items.length;
  // narrow viewBox for short arrays keeps text legible on small screens
  const WIDTH = Math.min(MAX_WIDTH, Math.max(380, n * 60 + 40));
  const mode = config.mode ?? "bars";
  const showAux = Boolean(config.auxRow) || Array.isArray(state.aux);
  const celebrate = step.type === "complete";

  const geometry = useMemo(() => {
    const slot = Math.min(76, (WIDTH - PAD * 2) / Math.max(n, 1));
    const startX = (WIDTH - slot * n) / 2;
    const values = items.map((e) => e.value);
    return { slot, startX, min: Math.min(...values), max: Math.max(...values) };
  }, [items, n, WIDTH]);

  const { slot, startX, min, max } = geometry;
  const roles = resolveRoles(n, state, focus);

  const isBars = mode === "bars";
  const topPad = 52;
  const barArea = 190;
  const cell = Math.min(slot - 8, 58);
  const baseY = isBars ? topPad + barArea : topPad + cell;
  const indexY = baseY + 20;
  const tagY = baseY + 38;
  const pointerY = baseY + 62;
  const mainBottom = pointerY + 24;
  const auxTop = mainBottom + 26;
  const auxArea = 84;
  const height = showAux ? auxTop + auxArea + 36 : mainBottom + 8;

  const barWidth = Math.min(slot * 0.74, 52);
  const xOf = (i) => startX + i * slot;
  const barHeight = (value) => 22 + barRatio(value, min, max) * (barArea - 22);
  const motionMs = `${transitionMs}ms`;

  // pointers: one glide-able element per name; same-index pointers stack vertically
  const pointerEntries = Object.entries(focus.pointers ?? {}).filter(
    ([, index]) => Number.isInteger(index) && index >= 0 && index < n,
  );
  const stackCount = {};
  const pointerLayout = pointerEntries.map(([name, index]) => {
    const stack = stackCount[index] ?? 0;
    stackCount[index] = stack + 1;
    return { name, index, stack };
  });

  const summary = `${isBars ? "Bar chart" : "Array"} of ${n} values: ${items
    .map((e) => e.value)
    .join(", ")}.`;

  const legend = (config.legend ?? LEGENDS[mode] ?? []).map((role) => ({
    role,
    label:
      config.legendLabels?.[role] ??
      (role === "sorted" ? (config.sortedLabel ?? "Sorted") : LEGEND_LABELS[role] ?? role),
    color: ROLE_STYLES[role]?.color,
    dashed: ROLE_STYLES[role]?.dashed,
    tag: ROLE_STYLES[role]?.tag,
  }));

  const win = state.window;

  return (
    <div className="flex w-full flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={summary}
      >
        {/* active range / candidate region (re-mounted per range so it fades in) */}
        {Array.isArray(state.range) && (
          <g key={`range-${state.range[0]}-${state.range[1]}`} className="viz-fade-in">
            <rect
              x={xOf(state.range[0]) + 2}
              y={topPad - 36}
              width={(state.range[1] - state.range[0] + 1) * slot - 4}
              height={baseY - topPad + 36 + 56}
              rx={10}
              fill="var(--foreground)"
              fillOpacity={0.05}
              stroke="var(--viz-active)"
              strokeOpacity={0.55}
              strokeDasharray="4 5"
            />
            <text
              x={xOf(state.range[0]) + 10}
              y={topPad - 20}
              fontSize={11}
              fill="var(--viz-active)"
              className="font-mono"
            >
              {config.rangeLabel ?? "range"} {state.range[0]}–{state.range[1]}
            </text>
          </g>
        )}

        {/* sliding window bracket: a unit-width path scaled to the window so it glides and stretches */}
        {win && (
          <g aria-hidden="true">
            <g
              className="viz-move"
              style={{
                transform: `translate(${xOf(win.from) + 4}px, ${topPad - 8}px)`,
                transitionDuration: motionMs,
              }}
            >
              <path
                d="M 0 0 v -9 H 1 v 9"
                fill="none"
                stroke="var(--viz-compare)"
                strokeWidth={2.5}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="viz-move"
                style={{
                  transform: `scaleX(${Math.max(xOf(win.to + 1) - xOf(win.from) - 8, 1)})`,
                  transformOrigin: "0 0",
                  transitionDuration: motionMs,
                }}
              />
            </g>
            <g
              className="viz-move"
              style={{
                transform: `translate(${(xOf(win.from) + xOf(win.to + 1)) / 2}px, ${topPad - 24}px)`,
                transitionDuration: motionMs,
              }}
            >
              <text
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="var(--viz-compare)"
                className="font-mono"
              >
                {win.label}
              </text>
            </g>
          </g>
        )}

        {/* divider between two halves */}
        {Number.isInteger(focus.divider) && (
          <line
            key={`divider-${focus.divider}`}
            x1={xOf(focus.divider + 1)}
            x2={xOf(focus.divider + 1)}
            y1={topPad - 30}
            y2={baseY + 8}
            stroke="var(--viz-active)"
            strokeWidth={2}
            strokeDasharray="3 4"
            className="viz-fade-in viz-march"
          />
        )}

        {/* main row */}
        {items.map((item, i) => {
          const { role, outsideRange } = roles[i];
          const style = roleStyle(role);
          const def = ROLE_STYLES[role];
          const lift = def?.lifted ? 16 : 0;
          const h = isBars ? barHeight(item.value) : cell;
          const w = isBars ? barWidth : cell;
          const x = (slot - w) / 2;
          const y = baseY - h - lift;
          const dim = outsideRange && role === "default" ? 0.4 : style.opacity;
          const hop = hopFor(i, focus);
          const wave = celebrate && CELEBRATING.has(role);
          const motion = hop ?? (wave ? "wave" : null);
          const glow = !celebrate && GLOWING.has(role);
          return (
            <g
              key={item.id}
              className="viz-move"
              style={{
                transform: `translate(${xOf(i)}px, 0px)`,
                transitionDuration: motionMs,
                opacity: dim,
              }}
            >
              {/* entrance (runs once on mount) */}
              <g
                className={isBars ? "viz-rise" : "viz-pop"}
                style={{ animationDelay: `${Math.min(i * 35, 600)}ms` }}
              >
                {/* per-step arc hop / completion wave: re-mounted only when a motion applies */}
                <g
                  key={motion ? `${motion}-${step.id}` : "idle"}
                  className={motion ? `viz-${motion}` : undefined}
                  style={
                    motion
                      ? {
                          animationDuration: wave ? "650ms" : motionMs,
                          animationDelay: wave ? `${i * 55}ms` : undefined,
                        }
                      : undefined
                  }
                >
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={isBars ? 5 : 8}
                    fill={style.fill}
                    fillOpacity={style.fillOpacity}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    strokeDasharray={style.dash}
                    className={cn("viz-fade", glow && "viz-glow")}
                    style={{ transitionDuration: motionMs, "--glow": style.stroke }}
                  />
                  <text
                    x={slot / 2}
                    y={isBars ? y - 8 : y + h / 2 + 5}
                    textAnchor="middle"
                    fontSize={isBars ? 14 : Math.max(10, Math.min(15, Math.round(w * 0.42)))}
                    fontWeight={600}
                    fill="var(--viz-label)"
                    className="font-mono"
                  >
                    {item.value}
                  </text>
                </g>
                <text
                  x={slot / 2}
                  y={indexY}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--muted-foreground)"
                  className="font-mono"
                >
                  {i}
                </text>
                {def?.tag && (
                  <text
                    key={`${role}`}
                    x={slot / 2}
                    y={tagY}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill={def.color ? colorVar(def.color === "dim" ? "label" : def.color) : "var(--muted-foreground)"}
                    style={def.color === "dim" ? { fill: "var(--muted-foreground)" } : undefined}
                    className="viz-fade-in"
                  >
                    {def.tag}
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {/* pointers glide between cells; each name is its own element */}
        {pointerLayout.map(({ name, index, stack }) => (
          <g
            key={name}
            className="viz-move"
            style={{
              transform: `translate(${xOf(index) + slot / 2}px, ${pointerY - 14 + stack * 16}px)`,
              transitionDuration: motionMs,
            }}
          >
            <g className="viz-fade-in">
              <path d="M-6 8 L6 8 L0 -2 Z" fill="var(--viz-active)" />
              <text
                y={22}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill="var(--viz-active)"
                className="font-mono"
              >
                {name}
              </text>
            </g>
          </g>
        ))}

        {/* merge buffer */}
        {showAux && (
          <g>
            <text
              x={PAD}
              y={auxTop - 6}
              fontSize={11}
              fill="var(--muted-foreground)"
              className="font-mono"
            >
              merge buffer
            </text>
            <line
              x1={PAD}
              x2={WIDTH - PAD}
              y1={auxTop + auxArea}
              y2={auxTop + auxArea}
              stroke="var(--border)"
            />
            {Array.isArray(state.aux) &&
              Array.isArray(state.range) &&
              Array.from({ length: state.range[1] - state.range[0] + 1 }, (_, k) => (
                <rect
                  key={`slot-${k}`}
                  x={xOf(state.range[0] + k) + (slot - barWidth) / 2}
                  y={auxTop + auxArea - 30}
                  width={barWidth}
                  height={30}
                  rx={4}
                  fill="none"
                  stroke="var(--viz-default-stroke)"
                  strokeDasharray="3 4"
                  strokeOpacity={0.6}
                />
              ))}
            {(state.aux ?? []).map((item, k) => {
              const at = Array.isArray(state.range) ? state.range[0] + k : k;
              const h = 14 + barRatio(item.value, min, max) * (auxArea - 20);
              const isNewest = k === state.aux.length - 1;
              return (
                <g key={item.id} style={{ transform: `translate(${xOf(at)}px, 0px)` }}>
                  {/* a newly buffered value drops in from the main row */}
                  <g
                    className="viz-drop"
                    style={{
                      "--drop": `${-(auxTop + auxArea - baseY)}px`,
                      animationDuration: `${Math.max(transitionMs, 1) * 1.6}ms`,
                    }}
                  >
                    <rect
                      x={(slot - barWidth) / 2}
                      y={auxTop + auxArea - h}
                      width={barWidth}
                      height={h}
                      rx={4}
                      fill="var(--viz-move)"
                      fillOpacity={isNewest ? 0.85 : 0.45}
                      stroke="var(--viz-move)"
                      strokeWidth={isNewest ? 3 : 1}
                      className="viz-fade"
                      style={{ transitionDuration: motionMs }}
                    />
                    <text
                      x={slot / 2}
                      y={auxTop + auxArea + 16}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill="var(--viz-label)"
                      className="font-mono"
                    >
                      {item.value}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        )}
      </svg>
      <VizLegend items={legend} />
    </div>
  );
}
