/**
 * Array visualization vocabulary
 * ------------------------------
 * state: { items:[{id,value}], sorted?:number[], range?:[lo,hi]|null, eliminated?:number[],
 *          consumed?:number[], aux?:[{id,value}]|null, found?:number|null }
 * focus: { comparing?:number[], swapping?:number[], shifting?:number[], moving?:number[],
 *          key?:number, active?:number[], placed?:number|number[], found?:number,
 *          divider?:number, pointers?:{[name]:number} }
 */

/** Visual style for each role. Colours are design tokens (see globals.css). */
export const ROLE_STYLES = {
  default: { color: null, tag: null },
  compare: { color: "compare", tag: "compare", dashed: true },
  swap: { color: "move", tag: "swap", heavy: true },
  shift: { color: "move", tag: "shift", heavy: true },
  take: { color: "move", tag: "take", heavy: true },
  key: { color: "select", tag: "key", lifted: true },
  active: { color: "active", tag: "focus", heavy: true },
  found: { color: "done", tag: "found", heavy: true },
  placed: { color: "done", tag: "placed" },
  sorted: { color: "done", tag: "✓" },
  consumed: { color: "dim", tag: "used", faded: true },
  eliminated: { color: "dim", tag: "out", faded: true },
};

const asArray = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

/**
 * Decide the role of every index. Transient focus beats persistent state.
 * Returns an array of { role, outsideRange } of length n.
 */
export function resolveRoles(n, state = {}, focus = {}) {
  const sorted = new Set(asArray(state.sorted));
  const eliminated = new Set(asArray(state.eliminated));
  const consumed = new Set(asArray(state.consumed));
  const comparing = new Set(asArray(focus.comparing));
  const swapping = new Set(asArray(focus.swapping));
  const shifting = new Set(asArray(focus.shifting));
  const moving = new Set(asArray(focus.moving));
  const active = new Set(asArray(focus.active));
  const placed = new Set(asArray(focus.placed));
  const range = state.range;

  return Array.from({ length: n }, (_, i) => {
    let role = "default";
    if (focus.found === i || state.found === i) role = "found";
    else if (swapping.has(i)) role = "swap";
    else if (shifting.has(i)) role = "shift";
    else if (focus.key === i) role = "key";
    else if (moving.has(i)) role = "take";
    else if (comparing.has(i)) role = "compare";
    else if (active.has(i)) role = "active";
    else if (placed.has(i)) role = "placed";
    else if (consumed.has(i)) role = "consumed";
    else if (eliminated.has(i)) role = "eliminated";
    else if (sorted.has(i)) role = "sorted";
    const outsideRange = Array.isArray(range) && (i < range[0] || i > range[1]);
    return { role, outsideRange };
  });
}

/** Group pointer names by index: { 3: ["lo","i"] }. Ignores out-of-bounds pointers. */
export function groupPointers(pointers = {}, n) {
  const byIndex = {};
  for (const [name, index] of Object.entries(pointers)) {
    if (!Number.isInteger(index) || index < 0 || index >= n) continue;
    (byIndex[index] ||= []).push(name);
  }
  return byIndex;
}

/** Normalised bar height in [0,1] for a value within the array's range. */
export function barRatio(value, min, max) {
  if (max === min) return 0.6;
  return (value - min) / (max - min);
}
