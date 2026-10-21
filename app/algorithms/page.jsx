import { AlgorithmExplorer } from "@/components/algorithm-library/algorithm-explorer";

export const metadata = {
  title: "Algorithms",
  description: "Browse AlgoMotion's interactive algorithm library by category and difficulty.",
};

export default function AlgorithmsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Algorithm library</h1>
        <p className="text-muted-foreground">
          Every algorithm runs for real in your browser. Open one to step through its execution,
          follow the pseudocode and try your own input.
        </p>
      </header>
      <AlgorithmExplorer />
    </div>
  );
}
