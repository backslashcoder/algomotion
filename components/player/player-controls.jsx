"use client";

import {
  Pause,
  Play,
  Repeat,
  RotateCcw,
  SkipBack,
  SkipForward,
  RotateCw,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { usePlaybackStore } from "@/stores/playback-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { PLAYBACK_STATUS, SPEEDS } from "@/engine/playback-controller";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";
import { ShortcutHelp } from "./shortcut-help";

const STATUS_LABEL = {
  idle: "No trace",
  error: "Unavailable",
  ready: "Ready",
  paused: "Paused",
  playing: "Playing",
  finished: "Finished",
};

/** Shared transport controls: used by every algorithm workspace. */
export function PlayerControls() {
  const status = usePlaybackStore((s) => s.status);
  const stepIndex = usePlaybackStore((s) => s.stepIndex);
  const totalSteps = usePlaybackStore((s) => s.totalSteps);
  const speed = usePlaybackStore((s) => s.speed);
  const loop = usePlaybackStore((s) => s.loop);
  const { togglePlay, stepForward, stepBackward, reset, seekToStep, setSpeed, setLoop } =
    usePlaybackStore.getState();
  const setSpeedPreference = usePreferencesStore((s) => s.setSpeedPreference);
  const setLoopPreference = usePreferencesStore((s) => s.setLoopPreference);

  const disabled = status === PLAYBACK_STATUS.IDLE || status === PLAYBACK_STATUS.ERROR;
  const playing = status === PLAYBACK_STATUS.PLAYING;
  const finished = status === PLAYBACK_STATUS.FINISHED;
  const playLabel = playing ? "Pause" : finished ? "Replay" : "Play";

  return (
    <div className="flex flex-col gap-3" role="group" aria-label="Playback controls">
      <div className="flex items-center gap-3">
        <Slider
          min={0}
          max={Math.max(totalSteps - 1, 0)}
          step={1}
          value={[Math.min(stepIndex, Math.max(totalSteps - 1, 0))]}
          onValueChange={(v) => seekToStep(Array.isArray(v) ? v[0] : v)}
          disabled={disabled || totalSteps <= 1}
          thumbLabel="Step timeline"
          aria-label="Step timeline"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <IconButton label="Reset to first step" shortcut="Home" variant="outline" size="icon-lg" onClick={reset} disabled={disabled}>
            <RotateCcw aria-hidden="true" />
          </IconButton>
          <IconButton label="Previous step" shortcut="←" variant="outline" size="icon-lg" onClick={stepBackward} disabled={disabled || stepIndex === 0}>
            <SkipBack aria-hidden="true" />
          </IconButton>
          <IconButton
            label={playLabel}
            shortcut="Space"
            size="icon-lg"
            className="mx-1 size-11 rounded-full"
            onClick={togglePlay}
            disabled={disabled || totalSteps <= 1}
          >
            {playing ? <Pause aria-hidden="true" /> : finished ? <RotateCw aria-hidden="true" /> : <Play aria-hidden="true" />}
          </IconButton>
          <IconButton label="Next step" shortcut="→" variant="outline" size="icon-lg" onClick={stepForward} disabled={disabled || stepIndex >= totalSteps - 1}>
            <SkipForward aria-hidden="true" />
          </IconButton>
          <IconButton
            label={loop ? "Loop: on" : "Loop: off"}
            variant={loop ? "secondary" : "ghost"}
            size="icon-lg"
            aria-pressed={loop}
            onClick={() => {
              setLoop(!loop);
              setLoopPreference(!loop);
            }}
            disabled={disabled}
            className={cn(loop && "text-primary")}
          >
            <Repeat aria-hidden="true" />
          </IconButton>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="flex items-center rounded-lg border bg-surface-2/60 p-0.5"
            role="radiogroup"
            aria-label="Playback speed"
          >
            {SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={speed === value}
                onClick={() => {
                  setSpeed(value);
                  setSpeedPreference(value);
                }}
                className={cn(
                  "h-7 min-w-9 rounded-md px-2 font-mono text-xs transition-colors",
                  speed === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {value}×
              </button>
            ))}
          </div>

          <div className="min-w-24 text-right" aria-live="off">
            <div className="font-mono text-sm tabular-nums" data-testid="step-counter">
              Step {totalSteps ? stepIndex + 1 : 0} / {totalSteps}
            </div>
            <div
              className={cn(
                "text-xs",
                playing ? "text-primary" : "text-muted-foreground",
              )}
              data-testid="playback-status"
            >
              {STATUS_LABEL[status]}
            </div>
          </div>
        </div>
      </div>

      <ShortcutHelp />
    </div>
  );
}
