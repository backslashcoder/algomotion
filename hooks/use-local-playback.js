"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPlaybackController } from "@/engine/playback-controller";

/**
 * A self-contained playback controller for small embedded previews (e.g. the
 * landing page) that must not touch the global workspace playback store.
 */
export function useLocalPlayback(totalSteps) {
  const [controller] = useState(() => createPlaybackController());
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );

  useEffect(() => {
    controller.load(totalSteps);
    return () => {
      controller.pause(); // stop the timer on unmount / trace change
    };
  }, [controller, totalSteps]);

  return {
    ...state,
    play: controller.play,
    pause: controller.pause,
    togglePlay: controller.togglePlay,
    stepForward: controller.stepForward,
    stepBackward: controller.stepBackward,
    seekToStep: controller.seekToStep,
    reset: controller.reset,
    setSpeed: controller.setSpeed,
  };
}
