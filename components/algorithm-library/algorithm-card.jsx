import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, TECHNIQUES } from "@/algorithms/registry";
import { DIFFICULTY_STYLES } from "@/lib/constants";
import { capitalize } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/** Catalogue card. Built purely from the algorithm's metadata. */
export function AlgorithmCard({ algorithm }) {
  const { slug, name, category, technique, difficulty, shortDescription, complexity } = algorithm;
  return (
    <article className="group relative flex w-full flex-col gap-3 rounded-xl border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-2/60 hover:shadow-lg hover:shadow-black/20">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{CATEGORIES[category]?.label ?? capitalize(category)}</Badge>
        <Badge variant="outline" className={cn(DIFFICULTY_STYLES[difficulty])}>
          {capitalize(difficulty)}
        </Badge>
        {TECHNIQUES[technique] && (
          <span className="text-xs text-muted-foreground">{TECHNIQUES[technique]}</span>
        )}
      </div>
      <h3 className="text-lg font-semibold tracking-tight">
        <Link
          href={`/algorithms/${slug}`}
          className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {name}
          <span className="sr-only">: open visualization</span>
        </Link>
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{shortDescription}</p>
      <dl className="mt-auto flex items-center gap-4 pt-2 font-mono text-xs">
        <div>
          <dt className="text-muted-foreground">Time (avg)</dt>
          <dd className="text-foreground">{complexity.time.average}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Space</dt>
          <dd className="text-foreground">{complexity.space}</dd>
        </div>
        <ArrowUpRight
          className="ml-auto size-5 text-muted-foreground transition-colors group-hover:text-primary"
          aria-hidden="true"
        />
      </dl>
    </article>
  );
}
