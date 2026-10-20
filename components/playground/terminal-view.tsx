"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Eraser, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OutputTone } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";
import type { TerminalEntry } from "./use-terminal";

const TONE_CLASS: Record<OutputTone, string> = {
  default: "text-terminal-fg",
  muted: "text-subtle",
  success: "text-accent-strong",
  info: "text-muted",
  warning: "text-warning",
  error: "text-danger",
};

interface TerminalViewProps {
  title: string;
  entries: TerminalEntry[];
  history: string[];
  onRun: (command: string) => void;
  onClear: () => void;
  onReset: () => void;
  prompt?: string;
  placeholder?: string;
  /** Pre-fill the input (e.g. from a suggestion chip). Changing the key re-applies it. */
  draft?: { key: number; value: string };
  welcome?: string;
  className?: string;
  bodyClassName?: string;
  inputLabel?: string;
}

export function TerminalView({
  title,
  entries,
  history,
  onRun,
  onClear,
  onReset,
  prompt = "$",
  placeholder = "Type a command and press Enter",
  draft,
  welcome,
  className,
  bodyClassName,
  inputLabel = "Simulated terminal command",
}: TerminalViewProps) {
  const [value, setValue] = useState("");
  const [cursor, setCursor] = useState<number | null>(null);
  const [appliedDraft, setAppliedDraft] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  if (draft && draft.key !== appliedDraft) {
    setAppliedDraft(draft.key);
    setValue(draft.value);
  }

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [entries]);

  useEffect(() => {
    if (draft) inputRef.current?.focus();
  }, [draft]);

  const submit = () => {
    if (!value.trim()) return;
    onRun(value);
    setValue("");
    setCursor(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      if (history.length === 0) return;
      e.preventDefault();
      const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setValue(history[next]);
    } else if (e.key === "ArrowDown") {
      if (cursor === null) return;
      e.preventDefault();
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(null);
        setValue("");
      } else {
        setCursor(next);
        setValue(history[next]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      onClear();
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-terminal", className)}>
      <div className="flex h-10 items-center justify-between gap-2 border-b border-border bg-background-2 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
          </span>
          <span className="truncate font-mono text-xs text-subtle">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge tone="outline">Simulated</Badge>
          <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Clear screen" title="Clear screen">
            <Eraser aria-hidden />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onReset} aria-label="Reset scenario" title="Reset scenario">
            <RotateCcw aria-hidden />
          </Button>
        </div>
      </div>
      <div
        ref={bodyRef}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
        onClick={() => {
          if (!window.getSelection()?.toString()) inputRef.current?.focus();
        }}
        className={cn(
          "scrollbar-thin max-h-[60vh] min-h-[16rem] overflow-y-auto p-4 font-mono text-[13px] leading-6 sm:text-sm",
          bodyClassName,
        )}
      >
        {welcome && entries.length === 0 ? <p className="whitespace-pre-wrap text-subtle">{welcome}</p> : null}
        {entries.map((entry, i) => (
          <div key={entry.id} className={cn(i > 0 && "mt-2 border-t border-border/60 pt-2")}>
            <p className="break-all">
              <span className="text-accent-strong">{prompt}</span> <span className="text-foreground">{entry.command}</span>
            </p>
            {entry.lines.map((line, j) => (
              <pre
                key={j}
                className={cn("whitespace-pre-wrap break-words font-mono", TONE_CLASS[line.tone ?? "default"])}
              >
                {line.tone === "error" && !/^(error|Error)/.test(line.text) ? "error: " : ""}
                {line.tone === "warning" && !/Warning/.test(line.text) ? "warning: " : ""}
                {line.text || " "}
              </pre>
            ))}
          </div>
        ))}
        <div className="mt-2 flex items-center gap-2 rounded-md focus-within:ring-1 focus-within:ring-accent-border">
          <label htmlFor={inputId} className="sr-only">
            {inputLabel}
          </label>
          <span className="text-accent-strong" aria-hidden>
            {prompt}
          </span>
          <input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setCursor(null);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            className="min-w-0 flex-1 bg-transparent text-foreground caret-accent-strong outline-none placeholder:text-subtle focus-visible:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border bg-background-2 px-3 py-2 sm:hidden">
        <span className="text-xs text-subtle">Output is simulated</span>
        <Button size="sm" onClick={submit} disabled={!value.trim()}>
          Run
        </Button>
      </div>
    </div>
  );
}
