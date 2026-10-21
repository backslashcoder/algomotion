"use client";

import { RENDERERS, StatePanelRenderer } from "@/visualizations/registry";

/** Resolves the renderer for an algorithm's visualization type and draws the current frame. */
export function VisualizationStage({ type, ...props }) {
  const Renderer = RENDERERS[type] ?? StatePanelRenderer;
  return <Renderer {...props} />;
}
