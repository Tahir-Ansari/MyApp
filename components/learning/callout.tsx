import { AlertTriangle, Info, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";

const STYLES = {
  info: { border: "border-l-accent", icon: Info, iconClass: "text-accent-strong", label: "Note" },
  tip: { border: "border-l-accent-strong", icon: Lightbulb, iconClass: "text-accent-strong", label: "Tip" },
  warning: { border: "border-l-warning", icon: AlertTriangle, iconClass: "text-warning", label: "Warning" },
  analogy: { border: "border-l-border-strong", icon: Sparkles, iconClass: "text-muted", label: "Analogy" },
} as const;

export function Callout({ tone, title, body }: { tone: keyof typeof STYLES; title: string; body: string }) {
  const style = STYLES[tone];
  const Icon = style.icon;
  return (
    <aside className={cn("rounded-lg border-l-2 bg-surface-2 p-4", style.border)} aria-label={`${style.label}: ${title}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className={cn("size-4 shrink-0", style.iconClass)} aria-hidden />
        {title}
      </p>
      <p className="prose-code mt-1.5 text-sm leading-6 text-muted">
        <RichText text={body} />
      </p>
    </aside>
  );
}
