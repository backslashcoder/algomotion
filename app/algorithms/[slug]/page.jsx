import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Workspace } from "@/components/workspace/workspace";
import { AlgorithmCard } from "@/components/algorithm-library/algorithm-card";
import { Panel } from "@/components/layout/panel";
import {
  CATEGORIES,
  getAlgorithm,
  getRelatedAlgorithms,
  listSlugs,
} from "@/algorithms/registry";
import { DIFFICULTY_STYLES } from "@/lib/constants";
import { capitalize } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return listSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const algorithm = getAlgorithm(slug);
  if (!algorithm) return { title: "Algorithm not found" };
  return { title: algorithm.name, description: algorithm.shortDescription };
}

export default async function AlgorithmPage({ params }) {
  const { slug } = await params;
  const algorithm = getAlgorithm(slug);
  if (!algorithm) notFound();
  const related = getRelatedAlgorithms(slug);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5 space-y-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground">
            <li>
              <Link href="/algorithms" className="rounded hover:text-foreground">
                Algorithms
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <li aria-current="page" className="text-foreground">
              {algorithm.name}
            </li>
          </ol>
        </nav>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{algorithm.name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {CATEGORIES[algorithm.category]?.label ?? capitalize(algorithm.category)}
            </Badge>
            <Badge variant="outline" className={cn(DIFFICULTY_STYLES[algorithm.difficulty])}>
              {capitalize(algorithm.difficulty)}
            </Badge>
          </div>
        </div>
        <p className="max-w-3xl text-muted-foreground">{algorithm.shortDescription}</p>
      </header>

      <Workspace slug={slug} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel title="The problem">
          <p className="leading-relaxed text-muted-foreground">{algorithm.problem}</p>
        </Panel>
        <Panel title="When to use it">
          <p className="leading-relaxed text-muted-foreground">{algorithm.whenToUse}</p>
        </Panel>
      </div>

      {related.length > 0 && (
        <section className="mt-10" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-4 text-lg font-semibold tracking-tight">
            Related algorithms
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <li key={a.id} className="flex">
                <div className="flex w-full">
                  <AlgorithmCard algorithm={a} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
