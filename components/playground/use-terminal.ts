"use client";

import { useCallback, useRef, useState } from "react";
import type { TrackId } from "@/lib/curriculum/types";
import { createSimState, runSimCommand, type SimState } from "@/lib/simulator/goals";
import type { OutputLine } from "@/lib/simulator/types";

export interface TerminalEntry {
  id: number;
  command: string;
  lines: OutputLine[];
  ok: boolean;
  explanation?: string;
}

export interface UseTerminalOptions {
  mode: TrackId;
  scenario?: string;
  onCommand?: (info: { command: string; ok: boolean; state: SimState }) => void;
}

export function useTerminal({ mode, scenario, onCommand }: UseTerminalOptions) {
  const [sim, setSim] = useState<SimState>(() => createSimState(mode, scenario));
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const seq = useRef(0);
  const simRef = useRef(sim);

  const run = useCallback(
    (raw: string) => {
      const command = raw.trim();
      if (!command) return;
      setHistory((h) => (h[h.length - 1] === command ? h : [...h.slice(-49), command]));
      if (command === "clear") {
        setEntries([]);
        return;
      }
      const result = runSimCommand(command, simRef.current);
      simRef.current = result.state;
      setSim(result.state);
      seq.current += 1;
      const entry: TerminalEntry = { id: seq.current, command, lines: result.lines, ok: result.ok, explanation: result.explanation };
      setEntries((list) => [...list.slice(-80), entry]);
      onCommand?.({ command, ok: result.ok, state: result.state });
    },
    [onCommand],
  );

  const clear = useCallback(() => setEntries([]), []);

  const reset = useCallback(
    (nextScenario?: string, nextMode?: TrackId) => {
      const fresh = createSimState(nextMode ?? mode, nextScenario ?? scenario);
      simRef.current = fresh;
      setSim(fresh);
      setEntries([]);
    },
    [mode, scenario],
  );

  return { sim, entries, history, run, clear, reset };
}
