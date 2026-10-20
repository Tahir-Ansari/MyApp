import { Diagram } from "@/components/diagrams/diagram";
import type { LessonSection as Section } from "@/lib/curriculum/types";
import { Callout } from "./callout";
import { CodeBlock } from "./code-block";
import { RichText } from "./rich-text";

export function LessonSection({ section }: { section: Section }) {
  switch (section.type) {
    case "text":
      return (
        <div className="prose-code max-w-prose">
          {section.heading ? <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">{section.heading}</h3> : null}
          <div className="space-y-3">
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-[15px] leading-7 text-foreground sm:text-base">
                <RichText text={p} />
              </p>
            ))}
          </div>
        </div>
      );
    case "list": {
      const List = section.ordered ? "ol" : "ul";
      return (
        <div className="prose-code max-w-prose">
          {section.heading ? <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">{section.heading}</h3> : null}
          <List className={section.ordered ? "list-decimal space-y-2 pl-5" : "space-y-2"}>
            {section.items.map((item, i) => (
              <li key={i} className={section.ordered ? "text-[15px] leading-7 text-foreground sm:text-base" : "flex gap-3 text-[15px] leading-7 text-foreground sm:text-base"}>
                {section.ordered ? null : <span className="mt-3 size-1.5 shrink-0 rounded-full bg-border-strong" aria-hidden />}
                <span className="min-w-0">
                  <RichText text={item} />
                </span>
              </li>
            ))}
          </List>
        </div>
      );
    }
    case "code":
      return <CodeBlock code={section.code} language={section.language} filename={section.filename} caption={section.caption} simulated={section.simulated} />;
    case "callout":
      return <Callout tone={section.tone} title={section.title} body={section.body} />;
    case "analogy":
      return <Callout tone="analogy" title={section.title} body={section.body} />;
    case "diagram":
      return <Diagram id={section.diagram} caption={section.caption} />;
  }
}
