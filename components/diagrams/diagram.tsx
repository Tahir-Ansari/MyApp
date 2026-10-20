import type { DiagramId } from "@/lib/curriculum/types";
import { DIAGRAMS } from "./registry";

export function Diagram({ id, caption }: { id: DiagramId; caption: string }) {
  const Component = DIAGRAMS[id];
  return (
    <figure className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="min-w-0 overflow-x-auto">
        <Component />
      </div>
      <figcaption className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted">{caption}</figcaption>
    </figure>
  );
}
