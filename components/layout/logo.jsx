import { cn } from "@/lib/utils";

/** AlgoMotion mark: three bars mid-sort with a motion trail. */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--surface-2)" stroke="var(--border)" />
      <rect x="7" y="15" width="4.5" height="10" rx="1.5" fill="var(--viz-compare)" />
      <rect x="13.75" y="8" width="4.5" height="17" rx="1.5" fill="var(--primary)" />
      <rect x="20.5" y="12" width="4.5" height="13" rx="1.5" fill="var(--viz-done)" />
      <path d="M8 6.5 Q16 2 24 6.5" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 3" />
    </svg>
  );
}

export function Logo({ className }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[17px]">
        Algo<span className="text-primary">Motion</span>
      </span>
    </span>
  );
}
