import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-10">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">This page doesn&apos;t exist</h1>
      <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
        The link may be mistyped, or the page may have moved. Your progress is safe. It&apos;s stored on this device.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">Go to the dashboard</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/learn">Browse lessons</Link>
        </Button>
      </div>
    </div>
  );
}
