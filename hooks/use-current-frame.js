"use client";

import { useMemo } from "react";
import { usePlaybackStore } from "@/stores/playback-store";
import { selectCurrentFrame, useWorkspaceStore } from "@/stores/workspace-store";

/** The frame ({ state, step, index }) for the current playback position. */
export function useCurrentFrame() {
  const trace = useWorkspaceStore((s) => s.trace);
  const stepIndex = usePlaybackStore((s) => s.stepIndex);
  return useMemo(
    () => selectCurrentFrame({ trace }, stepIndex),
    [trace, stepIndex],
  );
}
