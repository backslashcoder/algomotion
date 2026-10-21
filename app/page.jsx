import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  ListTree,
  MousePointerClick,
  StepForward,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { AlgorithmCard } from "@/components/algorithm-library/algorithm-card";
import { AlgorithmPreview } from "@/components/landing/algorithm-preview";
import { listAlgorithms } from "@/algorithms/registry";
import { FAMILIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FEATURED = ["bubble-sort", "merge-sort", "binary-search", "breadth-first-search"];

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick and configure",
    text: "Choose an algorithm, then keep the default example or type your own numbers or graph.",
  },
  {
    icon: StepForward,
    title: "Play, pause, rewind",
    text: "Run the real algorithm, or move one step at a time — forwards and backwards — with a scrubber and keyboard shortcuts.",
  },
  {
    icon: ListTree,
    title: "Follow the logic",
    text: "Every step highlights its pseudocode line and explains itself in plain English with the actual values.",
  },
  {
    icon: Gauge,
    title: "Measure what happened",
    text: "Watch comparisons, swaps and queue sizes accumulate, next to the theoretical complexity.",
  },
];

export default function HomePage() {
  const featured = FEATURED.map((slug) =>
    listAlgorithms().find((a) => a.slug === slug),
  ).filter(Boolean);

  return (
    <>
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:py-20">
          <div className="space-y-6">
            <Badge variant="outline" className="font-mono text-primary">
              Interactive algorithm laboratory
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl">
              See how algorithms <span className="text-primary">think</span>.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              Watch real executions unfold one operation at a time. Step backwards, inspect every
              variable, and try your own input until the idea clicks.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/algorithms" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}>
                Explore algorithms
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Link>
              <Link href="/about" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-base")}>
                How it works
              </Link>
            </div>
          </div>
          <AlgorithmPreview />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="featured-heading">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight">
              Start with a classic
            </h2>
            <p className="text-muted-foreground">Four algorithms, four different ways of thinking.</p>
          </div>
          <Link href="/algorithms" className={buttonVariants({ variant: "ghost" })}>
            View all
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((a) => (
            <li key={a.id} className="flex">
              <AlgorithmCard algorithm={a} />
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y bg-surface/50" aria-labelledby="how-heading">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <h2 id="how-heading" className="mb-10 text-2xl font-semibold tracking-tight">
            How interactive visualization works
          </h2>
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-lg border bg-surface-2 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="families-heading">
        <h2 id="families-heading" className="mb-2 text-2xl font-semibold tracking-tight">
          Algorithm families
        </h2>
        <p className="mb-6 text-muted-foreground">
          One shared engine powers every visualization, so new families plug in without rewrites.
        </p>
        <ul className="flex flex-wrap gap-2">
          {FAMILIES.map((f) => (
            <li
              key={f.id}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm",
                f.planned ? "text-muted-foreground" : "border-primary/40 bg-primary/10",
              )}
            >
              {f.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {f.planned ? "Planned" : "Available"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
