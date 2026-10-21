"use client";

import { useId, useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlgorithmCard } from "./algorithm-card";
import { CATEGORIES, DIFFICULTIES, listAlgorithms } from "@/algorithms/registry";
import { matchesQuery } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function FilterGroup({ label, options, value, onChange }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "h-8 rounded-full border px-3 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function AlgorithmExplorer() {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const all = listAlgorithms();
  const results = useMemo(
    () =>
      all.filter(
        (a) =>
          matchesQuery(a, query) &&
          (category === "all" || a.category === category) &&
          (difficulty === "all" || a.difficulty === difficulty),
      ),
    [all, query, category, difficulty],
  );

  const categoryOptions = [
    { id: "all", label: "All" },
    ...Object.values(CATEGORIES).map((c) => ({ id: c.id, label: c.label })),
  ];
  const difficultyOptions = [{ id: "all", label: "Any" }, ...DIFFICULTIES];
  const filtered = query || category !== "all" || difficulty !== "all";

  function clear() {
    setQuery("");
    setCategory("all");
    setDifficulty("all");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border bg-surface p-4">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search algorithms
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or keyword — try “queue”, “stable” or “divide”"
            className="h-10 pl-9"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <FilterGroup label="Category" options={categoryOptions} value={category} onChange={setCategory} />
          <FilterGroup label="Difficulty" options={difficultyOptions} value={difficulty} onChange={setDifficulty} />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p role="status" aria-live="polite" data-testid="result-count">
          {results.length} of {all.length} algorithms
        </p>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <X data-icon="inline-start" aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>

      {results.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((algorithm) => (
            <li key={algorithm.id} className="flex">
              <div className="flex w-full">
                <AlgorithmCard algorithm={algorithm} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">No algorithms match</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different keyword, or remove a filter. More algorithms are added regularly.
          </p>
          <Button variant="outline" onClick={clear}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
