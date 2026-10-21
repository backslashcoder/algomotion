"use client";

import { useEffect } from "react";
import { usePlaybackStore } from "@/stores/playback-store";

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** True when a key press should be left to the focused element. */
export function shouldIgnoreShortcut(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return true;
  const el = event.target;
  if (!(el instanceof HTMLElement)) return false;
  if (TYPING_TAGS.has(el.tagName) || el.isContentEditable) return true;
  const role = el.getAttribute("role");
  // sliders, radios and menus handle arrows/space themselves
  if (["slider", "radio", "combobox", "option", "listbox", "menuitem", "tab"].includes(role)) return true;
  // space on a focused button/link activates it; do not double-trigger
  if (event.key === " " && (el.tagName === "BUTTON" || el.tagName === "A")) return true;
  return false;
}

/**
 * Space = play/pause, ←/→ = step, Home/End = first/last step.
 * Ignored while typing and when focus is on controls that own those keys.
 */
export function usePlaybackShortcuts(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    function onKeyDown(event) {
      if (shouldIgnoreShortcut(event)) return;
      const playback = usePlaybackStore.getState();
      switch (event.key) {
        case " ":
          playback.togglePlay();
          break;
        case "ArrowRight":
          playback.stepForward();
          break;
        case "ArrowLeft":
          playback.stepBackward();
          break;
        case "Home":
          playback.seekToStep(0);
          break;
        case "End":
          playback.seekToStep(playback.totalSteps - 1);
          break;
        default:
          return;
      }
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
