"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Language = "bash" | "dockerfile" | "yaml" | "text" | "json";

const DOCKERFILE_KEYWORDS = /^(\s*)(FROM|WORKDIR|COPY|ADD|RUN|CMD|ENTRYPOINT|EXPOSE|ENV|ARG|USER|VOLUME|LABEL|HEALTHCHECK)\b/;

function highlightLine(line: string, language: Language, key: number) {
  // Comments
  const commentIndex = language === "text" || language === "json" ? -1 : line.search(/(^|\s)#/);
  let code = line;
  let comment = "";
  if (commentIndex !== -1) {
    code = line.slice(0, commentIndex);
    comment = line.slice(commentIndex);
  }
  let body: React.ReactNode = code;
  if (language === "dockerfile") {
    const m = code.match(DOCKERFILE_KEYWORDS);
    if (m) {
      body = (
        <>
          {m[1]}
          <span className="text-accent-strong">{m[2]}</span>
          {code.slice(m[0].length)}
        </>
      );
    }
  } else if (language === "yaml") {
    const m = code.match(/^(\s*-?\s*)([A-Za-z0-9_.\-/]+)(:)(.*)$/);
    if (m) {
      body = (
        <>
          {m[1]}
          <span className="text-muted">{m[2]}</span>
          {m[3]}
          <span className="text-foreground">{m[4]}</span>
        </>
      );
    }
  } else if (language === "bash") {
    const tokens = code.split(/(\s+)/);
    body = tokens.map((t, i) => {
      if (i === 0 && /^(docker|kubectl|curl|cat|ls)$/.test(t)) return <span key={i} className="text-accent-strong">{t}</span>;
      if (/^--?[a-zA-Z]/.test(t)) return <span key={i} className="text-warning/90">{t}</span>;
      return <span key={i}>{t}</span>;
    });
  }
  return (
    <span key={key} className="block min-h-6">
      {body}
      {comment ? <span className="italic text-subtle">{comment}</span> : null}
    </span>
  );
}

interface CodeBlockProps {
  code: string;
  language?: Language;
  filename?: string;
  caption?: string;
  simulated?: boolean;
  className?: string;
}

export function CodeBlock({ code, language = "text", filename, caption, simulated, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  };
  return (
    <figure className={cn("min-w-0", className)}>
      <div className="overflow-hidden rounded-lg border border-border bg-terminal">
        <div className="flex h-9 items-center justify-between gap-2 border-b border-border bg-background-2 px-3">
          <span className="truncate font-mono text-xs text-subtle">{filename ?? language}</span>
          <div className="flex items-center gap-2">
            {simulated ? <Badge tone="outline">Simulated output</Badge> : null}
            <button
              type="button"
              onClick={copy}
              className="inline-flex size-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
              aria-label={copied ? "Copied" : "Copy code"}
            >
              {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            </button>
          </div>
        </div>
        <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-[13px] leading-6 text-terminal-fg">
          <code>{code.split("\n").map((line, i) => highlightLine(line, language, i))}</code>
        </pre>
      </div>
      {caption ? <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption> : null}
    </figure>
  );
}
