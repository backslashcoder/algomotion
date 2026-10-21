"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/layout/panel";
import { PlayerControls } from "@/components/player/player-controls";
import { ExplanationPanel } from "@/components/explanations/explanation-panel";
import { PseudocodePanel } from "@/components/pseudocode/pseudocode-panel";
import { MetricsPanel } from "@/components/metrics/metrics-panel";
import { VariablesPanel } from "@/components/metrics/variables-panel";
import { ComplexityPanel } from "@/components/metrics/complexity-panel";
import { getAlgorithm } from "@/algorithms/registry";
import { VisualizationStage } from "./visualization-stage";
import { InputEditor } from "@/components/inputs/input-editor";
import { useCurrentFrame } from "@/hooks/use-current-frame";
import { usePlaybackShortcuts } from "@/hooks/use-playback-shortcuts";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { usePlaybackStore } from "@/stores/playback-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

/** Client-side learning workspace for one algorithm. Everything shared lives here. */
export function Workspace({ slug }) {
  const definition = getAlgorithm(slug);
  const openedSlug = useWorkspaceStore((s) => s.slug);
  const trace = useWorkspaceStore((s) => s.trace);
  const error = useWorkspaceStore((s) => s.error);

  usePlaybackShortcuts(Boolean(trace));

  useEffect(() => {
    let cancelled = false;
    const workspace = useWorkspaceStore.getState();
    workspace.openAlgorithm(slug);
    // restore small saved preferences (speed / loop) after hydration
    Promise.resolve(usePreferencesStore.persist.rehydrate()).then(() => {
      if (cancelled) return;
      const { speed, loop } = usePreferencesStore.getState();
      const playback = usePlaybackStore.getState();
      playback.setSpeed(speed);
      playback.setLoop(loop);
    });
    return () => {
      cancelled = true;
      useWorkspaceStore.getState().close(); // stops the playback timer
    };
  }, [slug]);

  if (!definition) return null;
  if (error && !trace) return <WorkspaceError error={error} slug={slug} />;
  if (!trace || openedSlug !== slug) return <WorkspaceSkeleton />;

  return <WorkspaceBody definition={definition} />;
}

function WorkspaceBody({ definition }) {
  const frame = useCurrentFrame();
  const totalSteps = useWorkspaceStore((s) => s.trace.steps.length);
  const input = useWorkspaceStore((s) => s.input);
  const version = useWorkspaceStore((s) => s.version);
  const speed = usePlaybackStore((s) => s.speed);
  const reducedMotion = useReducedMotion();

  if (!frame) return <WorkspaceSkeleton />;

  // animation length follows playback speed but never drives the logical state
  const transitionMs = reducedMotion ? 0 : Math.round(Math.min(400, 400 / speed));

  const { applyInput, resetInput } = useWorkspaceStore.getState();

  return (
    <div className="viz-fade-up space-y-6">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <section
            aria-label="Visualization"
            className="overflow-hidden rounded-xl border bg-surface"
          >
            <div className="stage-grid px-3 py-5 sm:px-6" data-testid="stage">
              <VisualizationStage
                key={version}
                type={definition.visualization.type}
                frame={frame}
                config={definition.visualization.config}
                transitionMs={transitionMs}
              />
            </div>
            <div className="border-t p-4">
              <PlayerControls />
            </div>
          </section>

          <ExplanationPanel step={frame.step} stepIndex={frame.index} totalSteps={totalSteps} />

          <Panel
            title="Input"
            description="Change the input to regenerate the execution trace"
            data-testid="input-panel"
          >
            {input && (
              <InputEditor
                editor={definition.inputEditor}
                definition={definition}
                input={input}
                onApply={applyInput}
                onReset={resetInput}
              />
            )}
          </Panel>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:col-span-4" aria-label="Execution details">
          <PseudocodePanel lines={definition.pseudocode} activeLine={frame.step.line} />
          <VariablesPanel variables={frame.step.variables} />
          <MetricsPanel metrics={definition.metrics} values={frame.step.metrics} />
          <ComplexityPanel complexity={definition.complexity} />
        </aside>
      </div>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12" aria-busy="true" aria-label="Loading workspace">
      <div className="h-[520px] animate-pulse rounded-xl border bg-surface lg:col-span-8" />
      <div className="h-[520px] animate-pulse rounded-xl border bg-surface lg:col-span-4" />
    </div>
  );
}

function WorkspaceError({ error, slug }) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center"
    >
      <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
      <h2 className="text-lg font-semibold">This workspace could not start</h2>
      <ul className="text-sm text-muted-foreground">
        {error.messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <Button onClick={() => useWorkspaceStore.getState().openAlgorithm(slug)}>
        Try again
      </Button>
    </div>
  );
}
