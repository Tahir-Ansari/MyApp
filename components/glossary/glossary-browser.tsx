"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SearchX, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GLOSSARY_CATEGORY_LABEL, type GlossaryCategory, type ResolvedGlossaryTerm } from "@/lib/glossary/terms";

type Filter = "all" | GlossaryCategory;
const FILTERS: Filter[] = ["all", "docker", "kubernetes", "general"];

function normalize(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

/** Ranks name matches above alias matches above definition matches. */
function score(t: ResolvedGlossaryTerm, q: string): number {
  if (!q) return 1;
  const name = normalize(t.term);
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  if (t.aliases?.some((a) => normalize(a).includes(q))) return 40;
  if (normalize(t.definition).includes(q) || (t.example && normalize(t.example).includes(q))) return 20;
  return 0;
}

export function GlossaryBrowser({ terms }: { terms: ResolvedGlossaryTerm[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const deferred = useDeferredValue(query);
  const inputId = useId();
  const byId = useMemo(() => new Map(terms.map((t) => [t.id, t])), [terms]);

  const results = useMemo(() => {
    const q = normalize(deferred.trim());
    return terms
      .filter((t) => filter === "all" || t.category === filter)
      .map((t) => ({ t, s: score(t, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.t.term.localeCompare(b.t.term))
      .map((x) => x.t);
  }, [terms, deferred, filter]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: terms.length, docker: 0, kubernetes: 0, general: 0 };
    for (const t of terms) c[t.category]++;
    return c;
  }, [terms]);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label htmlFor={inputId} className="sr-only">
          Search the glossary
        </label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            id={inputId}
            type="search"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search terms, commands, or ideas — e.g. Deployment, -p, base64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-lg border border-border-strong bg-surface-2 pl-9 pr-10 text-base text-foreground placeholder:text-subtle focus-visible:border-accent-border sm:text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:bg-surface-3 hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
        <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors sm:min-h-9",
                  active
                    ? "border-accent-border bg-accent-soft font-medium text-foreground"
                    : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-foreground",
                )}
              >
                {f === "all" ? "All" : GLOSSARY_CATEGORY_LABEL[f]}
                <span className="font-mono text-xs text-subtle">{counts[f]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-xs text-muted">
        {results.length === terms.length
          ? `${terms.length} terms`
          : `${results.length} of ${terms.length} terms${deferred.trim() ? ` match “${deferred.trim()}”` : ""}`}
      </p>

      {results.length === 0 ? (
        <Card className="bg-grid p-5 sm:p-8">
          <div className="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-subtle">
            <SearchX aria-hidden className="size-5" />
          </div>
          <p className="mt-3 font-medium">No terms match that search</p>
          <p className="mt-1 text-sm text-muted">Try a shorter word, or search all topics.</p>
          <Button
            variant="secondary"
            className="mt-4 min-h-11"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Clear search
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {results.map((t) => (
            <li key={t.id} id={t.id} className="scroll-mt-24">
              <Card className="flex h-full flex-col p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className={cn("text-base font-semibold tracking-tight", t.id === "kubectl" && "font-mono")}>
                    {t.term}
                  </h2>
                  <Badge tone="outline">{GLOSSARY_CATEGORY_LABEL[t.category]}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{t.definition}</p>
                {t.example && (
                  <p className="prose-code mt-2 text-sm leading-6 text-muted">
                    <span className="font-medium text-foreground">Example: </span>
                    {t.example}
                  </p>
                )}
                {t.related && t.related.length > 0 && (
                  <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-subtle">
                    See also:
                    {t.related
                      .map((id) => byId.get(id))
                      .filter((r): r is ResolvedGlossaryTerm => Boolean(r))
                      .map((r) => (
                        <a
                          key={r.id}
                          href={`#${r.id}`}
                          onClick={() => {
                            // Make sure the target is visible before jumping to it.
                            setQuery("");
                            setFilter("all");
                          }}
                          className="rounded text-muted underline decoration-border-strong underline-offset-2 hover:text-foreground"
                        >
                          {r.term}
                        </a>
                      ))}
                  </p>
                )}
                {t.lesson && (
                  <div className="mt-auto pt-4">
                    <Link
                      href={`/lesson/${t.lesson.slug}`}
                      className="group inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-accent-strong hover:underline sm:min-h-0"
                    >
                      <span className="font-mono text-xs text-subtle">L{String(t.lesson.number).padStart(2, "0")}</span>
                      {t.lesson.title}
                      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
