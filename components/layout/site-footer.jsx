import Link from "next/link";
import { Logo } from "./logo";
import { SITE } from "@/lib/constants";
import { listAlgorithms } from "@/algorithms/registry";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{SITE.description}</p>
        </div>
        <nav aria-label="Algorithms">
          <h2 className="mb-3 text-sm font-semibold">Algorithms</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {listAlgorithms().map((a) => (
              <li key={a.slug}>
                <Link className="hover:text-foreground" href={`/algorithms/${a.slug}`}>
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Product">
          <h2 className="mb-3 text-sm font-semibold">Product</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/algorithms">Explore all</Link></li>
            <li><Link className="hover:text-foreground" href="/about">About</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          AlgoMotion. Runs entirely in your browser.
        </p>
      </div>
    </footer>
  );
}
