/**
 * A tiny, safe argument parser for the simulated terminal.
 * It never evaluates anything. It only splits text into tokens and flags.
 */

export type TokenizeResult = { ok: true; tokens: string[] } | { ok: false; error: string };

export function tokenize(input: string): TokenizeResult {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let hasToken = false;
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      hasToken = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (hasToken) tokens.push(current);
      current = "";
      hasToken = false;
      continue;
    }
    current += ch;
    hasToken = true;
  }
  if (quote) return { ok: false, error: "unterminated quote in command" };
  if (hasToken) tokens.push(current);
  return { ok: true, tokens };
}

export interface ArgSpec {
  /** Flags that take no value, e.g. "d", "it", "all". Listed without dashes. */
  boolean?: string[];
  /** Flags that take a value, e.g. "p", "name". Listed without dashes. */
  value?: string[];
  /** Map of alias to canonical name, e.g. { a: "all" }. */
  aliases?: Record<string, string>;
  /** Stop treating tokens as flags after the first positional (used by `docker run IMAGE CMD...`). */
  stopAtFirstPositional?: boolean;
}

export interface ParsedArgs {
  positionals: string[];
  /** Last value for each flag (true for booleans). */
  flags: Record<string, string | true>;
  /** Every value for repeatable flags such as -p, -e, -v. */
  multi: Record<string, string[]>;
  /** Tokens after the first positional when stopAtFirstPositional is set. */
  rest: string[];
  unknown: string[];
  missingValue: string[];
}

export function parseArgs(tokens: string[], spec: ArgSpec = {}): ParsedArgs {
  const booleans = new Set(spec.boolean ?? []);
  const values = new Set(spec.value ?? []);
  const aliases = spec.aliases ?? {};
  const result: ParsedArgs = { positionals: [], flags: {}, multi: {}, rest: [], unknown: [], missingValue: [] };

  const canonical = (name: string) => aliases[name] ?? name;
  const setFlag = (name: string, value: string | true) => {
    result.flags[name] = value;
    if (typeof value === "string") (result.multi[name] ??= []).push(value);
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (spec.stopAtFirstPositional && result.positionals.length > 0) {
      result.rest = tokens.slice(i);
      break;
    }
    if (token === "--") {
      result.positionals.push(...tokens.slice(i + 1));
      break;
    }
    if (token.startsWith("--") && token.length > 2) {
      const [rawName, inlineValue] = splitOnce(token.slice(2), "=");
      const name = canonical(rawName);
      if (values.has(name)) {
        if (inlineValue !== undefined) setFlag(name, inlineValue);
        else if (i + 1 < tokens.length) setFlag(name, tokens[++i]);
        else result.missingValue.push(rawName);
      } else if (booleans.has(name)) {
        setFlag(name, true);
      } else {
        result.unknown.push(token);
      }
      continue;
    }
    if (token.startsWith("-") && token.length > 1 && !/^-\d/.test(token)) {
      const body = token.slice(1);
      const [rawName, inlineValue] = splitOnce(body, "=");
      const whole = canonical(rawName);
      // Accept whole-word short flags such as -it, -l, -n, -f.
      if (values.has(whole)) {
        if (inlineValue !== undefined) setFlag(whole, inlineValue);
        else if (i + 1 < tokens.length) setFlag(whole, tokens[++i]);
        else result.missingValue.push(rawName);
        continue;
      }
      if (booleans.has(whole)) {
        setFlag(whole, true);
        continue;
      }
      // Combined short booleans: -dit, possibly ending with a value flag: -dp 8080:80
      let handled = true;
      for (let c = 0; c < body.length; c++) {
        const name = canonical(body[c]);
        if (booleans.has(name)) {
          setFlag(name, true);
        } else if (values.has(name)) {
          const remainder = body.slice(c + 1);
          if (remainder) setFlag(name, remainder.replace(/^=/, ""));
          else if (i + 1 < tokens.length) setFlag(name, tokens[++i]);
          else result.missingValue.push(name);
          break;
        } else {
          handled = false;
          break;
        }
      }
      if (!handled) result.unknown.push(token);
      continue;
    }
    result.positionals.push(token);
  }
  return result;
}

function splitOnce(text: string, sep: string): [string, string | undefined] {
  const idx = text.indexOf(sep);
  if (idx === -1) return [text, undefined];
  return [text.slice(0, idx), text.slice(idx + 1)];
}

/** Collapse whitespace so commands can be compared against goal patterns. */
export function normalizeCommand(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

/** Render rows as a left-aligned table separated by 3 spaces, like CLI output. */
export function formatTable(headers: string[], rows: string[][]): string[] {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)));
  const line = (cells: string[]) =>
    cells
      .map((cell, i) => (i === cells.length - 1 ? cell : cell.padEnd(widths[i] + 3)))
      .join("")
      .trimEnd();
  return [line(headers), ...rows.map(line)];
}
