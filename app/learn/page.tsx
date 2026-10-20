import type { Metadata } from "next";
import { LearnOverview } from "@/components/learning/learn-overview";
import { PageHeader } from "@/components/ui/card";
import { TOTAL_LESSONS } from "@/lib/curriculum/catalog";

export const metadata: Metadata = {
  title: "Learning path",
  description: "The full Docker Foundations and Kubernetes Adventures curriculum, module by module.",
};

export default function LearnPage() {
  return (
    <>
      <PageHeader
        eyebrow="Learning path"
        title="From containers to clusters"
        description={`${TOTAL_LESSONS} short lessons in 8 modules. Each one follows the same loop: learn, visualise, try, check, reflect.`}
      />
      <LearnOverview />
    </>
  );
}
