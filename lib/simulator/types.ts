export type OutputTone = "default" | "muted" | "error" | "success" | "info" | "warning";

export interface OutputLine {
  text: string;
  tone?: OutputTone;
}

export interface CommandResult<State> {
  state: State;
  lines: OutputLine[];
  /** Plain-language explanation shown in the "What did this command do?" panel. */
  explanation?: string;
  ok: boolean;
  /** UI should clear the screen. */
  clear?: boolean;
}

export interface Simulator<State> {
  run(input: string, state: State): CommandResult<State>;
}

export const out = (text: string, tone: OutputTone = "default"): OutputLine => ({ text, tone });
export const err = (text: string): OutputLine => ({ text, tone: "error" });
export const info = (text: string): OutputLine => ({ text, tone: "info" });
export const muted = (text: string): OutputLine => ({ text, tone: "muted" });
export const success = (text: string): OutputLine => ({ text, tone: "success" });
