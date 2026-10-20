"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// The offline page is served in place of whatever URL was requested. Capture that URL at module load,
// before hydration can normalise the address bar, so "Try again" retries the page the learner wanted.
const requestedHref = typeof window !== "undefined" ? window.location.href : "";

export function RetryButton() {
  return (
    <Button className="min-h-11" onClick={() => window.location.assign(requestedHref || window.location.href)}>
      <RotateCcw aria-hidden />
      Try again
    </Button>
  );
}
