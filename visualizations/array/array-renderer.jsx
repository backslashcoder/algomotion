"use client";

import { useMemo } from "react";
import { ROLE_STYLES, barRatio, groupPointers, resolveRoles } from "./roles";
import { VizLegend } from "../shared/legend";

const MAX_WIDTH = 800;
const PAD = 24;

const colorVar = (name) => `var(--viz-${name})`;

function roleStyle(role) {
  const def = ROLE_STYLES[role] ?? ROLE_STYLES.default;
  return {
    fill: def.color ? colorVar(def.color) : "var(--viz-default)",
    stroke: def.color ? colorVar(def.color) : "var(--viz-default-stroke)",
    fillOpacity: def.color ? (def.faded ? 0.5 : 0.85) : 1,
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
  compare: "Comparing",
  swap: "Swapping / moving",
  key: "Key (selected)",
  active: "Focus / midpoint",
  eliminated: "Eliminated",
  found: "Found",
};

/**
 * Renders the array family: sorting bars and search cells.
 * It only reads `state` + `focus`; it never knows which algorithm produced them.
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

  const geometry = useMemo(() => {
    const slot = Math.min(76, (WIDTH - PAD * 2) / Math.max(n, 1));
    const startX = (WIDTH - slot * n) / 2;
    const values = items.map((e) => e.value);
    return { slot, startX, min: Math.min(...values), max: Math.max(...values) };
  }, [items, n, WIDTH]);

  const { slot, startX, min, max } = geometry;
  const roles = resolveRoles(n, state, focus);
  const pointers = groupPointers(focus.pointers, n);

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

  const summary = `${isBars ? "Bar chart" : "Array"} of ${n} values: ${items
    .map((e) => e.value)
    .join(", ")}.`;

  const legend = (config.legend ?? LEGENDS[mode] ?? []).map((role) => ({
    role,
    label:
      role === "sorted"
        ? (config.sortedLabel ?? "Sorted")
        : LEGEND_LABELS[role] ?? role,
    color: ROLE_STYLES[role]?.color,
    dashed: ROLE_STYLES[role]?.dashed,
    tag: ROLE_STYLES[role]?.tag,
  }));

  return (
    <div className="flex w-full flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={summary}
      >
        {/* active range / candidate region */}
        {Array.isArray(state.range) && (
          <g>
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
              className="viz-fade"
              style={{ transitionDuration: `${transitionMs}ms` }}
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

        {/* divider between two halves */}
        {Number.isInteger(focus.divider) && (
          <line
            x1={xOf(focus.divider + 1)}
            x2={xOf(focus.divider + 1)}
            y1={topPad - 30}
            y2={baseY + 8}
            stroke="var(--viz-active)"
            strokeWidth={2}
            strokeDasharray="3 4"
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
          return (
            <g
              key={item.id}
              className="viz-move"
              style={{
                transform: `translate(${xOf(i)}px, 0px)`,
                transitionDuration: `${transitionMs}ms`,
                opacity: dim,
              }}
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
                className="viz-fade"
                style={{ transitionDuration: `${transitionMs}ms` }}
              />
              <text
                x={slot / 2}
                y={isBars ? y - 8 : y + h / 2 + 5}
                textAnchor="middle"
                fontSize={isBars ? 14 : 15}
                fontWeight={600}
                fill="var(--viz-label)"
                className="font-mono"
              >
                {item.value}
              </text>
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
                  x={slot / 2}
                  y={tagY}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill={def.color ? colorVar(def.color === "dim" ? "label" : def.color) : "var(--muted-foreground)"}
                  style={def.color === "dim" ? { fill: "var(--muted-foreground)" } : undefined}
                >
                  {def.tag}
                </text>
              )}
            </g>
          );
        })}

        {/* pointers */}
        {Object.entries(pointers).map(([index, names]) => (
          <g key={index} transform={`translate(${xOf(Number(index)) + slot / 2}, ${pointerY - 14})`}>
            <path d="M-6 8 L6 8 L0 -2 Z" fill="var(--viz-active)" />
            <text
              y={22}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="var(--viz-active)"
              className="font-mono"
            >
              {names.join(",")}
            </text>
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
                <g
                  key={item.id}
                  style={{ transform: `translate(${xOf(at)}px, 0px)` }}
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
              );
            })}
          </g>
        )}
      </svg>
      <VizLegend items={legend} />
    </div>
  );
}
