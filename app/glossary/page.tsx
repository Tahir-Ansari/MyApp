import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { GlossaryBrowser } from "@/components/glossary/glossary-browser";
import { getGlossaryTerms } from "@/lib/glossary/terms";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Beginner-friendly definitions of Docker and Kubernetes terms, each linked to the lesson that teaches it.",
};

export default function GlossaryPage() {
  const terms = getGlossaryTerms();
  return (
    <>
      <PageHeader
        eyebrow="Reference"
        title="Glossary"
        description="Plain-language definitions of the Docker and Kubernetes words you'll meet. Each one links to the lesson that teaches it."
      />
      <GlossaryBrowser terms={terms} />
    </>
  );
}
