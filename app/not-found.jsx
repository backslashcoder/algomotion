import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">We couldn’t find that page</h1>
      <p className="text-muted-foreground">
        The algorithm or page you’re looking for doesn’t exist (yet).
      </p>
      <Link href="/algorithms" className={buttonVariants({ size: "lg" })}>
        Browse algorithms
      </Link>
    </div>
  );
}
