import { ArrayRenderer } from "./array/array-renderer";
import { GraphRenderer } from "./graph/graph-renderer";
import { StatePanelRenderer } from "./state-panel/state-panel-renderer";

export { StatePanelRenderer };

/**
 * Visualization adapter registry: maps `definition.visualization.type` to a renderer.
 *
 * Renderer contract:  <Renderer frame={{ state, step, index }} config={...} transitionMs={n} />
 * A renderer reads state + step.focus only. It never runs algorithm logic.
 *
 * Planned types (add a renderer module and one line here): tree, table, call-stack,
 * heap, linked-list, hash-table, trie, geometry, string-match.
 */
export const RENDERERS = {
  array: ArrayRenderer,
  graph: GraphRenderer,
  "state-panel": StatePanelRenderer,
};

export function getRenderer(type) {
  return RENDERERS[type] ?? StatePanelRenderer;
}

export function listVisualizationTypes() {
  return Object.keys(RENDERERS);
}
