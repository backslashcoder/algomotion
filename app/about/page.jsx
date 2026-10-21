import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata = {
  title: "About",
  description: "The learning philosophy behind AlgoMotion.",
};

const PRINCIPLES = [
  {
    title: "Real executions, not canned animations",
    text: "Every step you see comes from the algorithm actually running on your input. Nothing is pre-recorded, so edge cases such as duplicates, empty queues and disconnected graphs behave exactly as they would in code.",
  },
  {
    title: "You control time",
    text: "Play, pause, step forward and — just as importantly — step backward. Understanding often comes from replaying the one moment that confused you.",
  },
  {
    title: "Explanations at the moment they matter",
    text: "Each step comes with a sentence describing what is happening and why, using the real values, and highlights the matching pseudocode line.",
  },
  {
    title: "Experiment freely",
    text: "Type your own array or graph, load edge cases, and watch how the observed counts change. Theoretical complexity is shown separately so you can compare the promise with the evidence.",
  },
  {
    title: "Accessible by design",
    text: "Meaning never relies on colour alone, everything works from the keyboard, and motion is reduced when your system asks for it.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">About AlgoMotion</h1>
      <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
        AlgoMotion is an interactive laboratory for learning how algorithms work. It runs entirely in
        your browser — no accounts, no servers, no waiting.
      </p>
      <div className="space-y-8">
        {PRINCIPLES.map((p) => (
          <section key={p.title} className="space-y-2 border-l-2 border-primary/60 pl-5">
            <h2 className="text-lg font-semibold tracking-tight">{p.title}</h2>
            <p className="leading-relaxed text-muted-foreground">{p.text}</p>
          </section>
        ))}
      </div>
      <h2 className="mb-3 mt-12 text-xl font-semibold tracking-tight">How it is built</h2>
      <p className="mb-6 leading-relaxed text-muted-foreground">
        Algorithms produce a deterministic execution trace. A shared playback engine, pseudocode
        panel, explanation panel and metrics read that trace, and a visualization adapter draws it.
        That separation is what lets one engine serve sorting, searching and graphs today and many
        more families tomorrow.
      </p>
      <Link href="/algorithms" className={buttonVariants({ size: "lg" })}>
        Browse the library
      </Link>
    </div>
  );
}
