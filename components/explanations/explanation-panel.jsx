"use client";

import { Panel } from "@/components/layout/panel";
import { Badge } from "@/components/ui/badge";
import { usePlaybackStore } from "@/stores/playback-store";

const humanize = (type) => type.replace(/-/g, " ");

/**
 * Plain-English description of the current event. A separate visually hidden
 * live region announces step changes only while playback is NOT running, so
 * screen readers are not flooded during autoplay.
 */
export function ExplanationPanel({ step, stepIndex, totalSteps }) {
  const status = usePlaybackStore((s) => s.status);
  const announce = status === "playing" ? "" : step.explanation;

  return (
    <Panel
      title="What's happening"
      action={
        <Badge variant="outline" className="font-mono capitalize">
          {humanize(step.type)}
        </Badge>
      }
    >
      <p
        key={step.id}
        className="min-h-14 text-[15px] leading-relaxed text-foreground"
        data-testid="explanation"
      >
        {step.explanation}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Step {stepIndex + 1} of {totalSteps}
      </p>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
    </Panel>
  );
}
