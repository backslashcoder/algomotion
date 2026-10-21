"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrayRenderer } from "@/visualizations/array/array-renderer";
import { bubbleSort } from "@/algorithms/sorting/bubble-sort";
import { generateTrace } from "@/engine/trace-generator";
import { getFrame } from "@/engine/state-reconstruction";
import { useLocalPlayback } from "@/hooks/use-local-playback";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const PREVIEW_INPUT = { array: [5, 2, 8, 1, 9, 3] };

/**
 * Small live demo for the landing page. It runs the real Bubble Sort trace
 * through the shared engine, using its own local playback controller.
 */
export function AlgorithmPreview() {
  const trace = useMemo(() => generateTrace(bubbleSort, PREVIEW_INPUT), []);
  const playback = useLocalPlayback(trace.steps.length);
  const reducedMotion = useReducedMotion();
  const index = Math.min(playback.stepIndex, trace.steps.length - 1);
  const frame = getFrame(trace, index);
  const playing = playback.status === "playing";

  // The hero demo plays itself (looping at 2x) unless the user prefers reduced motion.
  // Any manual control press pauses it and it stays under the visitor's control.
  const autoStarted = useRef(false);
  const { status, setLoop, setSpeed, play } = playback;
  useEffect(() => {
    if (reducedMotion || autoStarted.current || status !== "ready") return undefined;
    autoStarted.current = true;
    const timer = setTimeout(() => {
      setLoop(true);
      setSpeed(2);
      play();
    }, 900);
    return () => {
      clearTimeout(timer);
      autoStarted.current = false;
    };
  }, [reducedMotion, status, setLoop, setSpeed, play]);

  return (
    <div className="overflow-hidden rounded-2xl border bg-surface shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Bubble Sort · live preview</span>
        <span className="font-mono">
          step {index + 1}/{trace.steps.length}
        </span>
      </div>
      <div className="stage-grid px-3 py-4" data-testid="preview-stage">
        <ArrayRenderer
          frame={frame}
          config={{ mode: "bars", sortedLabel: "Sorted" }}
          transitionMs={reducedMotion ? 0 : 300}
        />
      </div>
      <div className="space-y-3 border-t p-4">
        <p className="min-h-12 text-sm leading-relaxed" data-testid="preview-explanation">
          {frame.step.explanation}
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon-lg" aria-label="Reset preview" onClick={playback.reset}>
              <RotateCcw aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Previous step"
              onClick={playback.stepBackward}
              disabled={index === 0}
            >
              <SkipBack aria-hidden="true" />
            </Button>
            <Button size="lg" onClick={playback.togglePlay} className="h-9 min-w-24">
              {playing ? <Pause data-icon="inline-start" aria-hidden="true" /> : <Play data-icon="inline-start" aria-hidden="true" />}
              {playing ? "Pause" : playback.status === "finished" ? "Replay" : "Play"}
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Next step"
              onClick={playback.stepForward}
              disabled={index >= trace.steps.length - 1}
            >
              <SkipForward aria-hidden="true" />
            </Button>
          </div>
          <Link href="/algorithms/bubble-sort" className={buttonVariants({ variant: "link" })}>
            Open full workspace
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
