import type { Metadata } from "next";
import { ChallengeCatalog } from "@/components/challenges/challenge-catalog";
import { PageHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Challenges",
  description: "Hands-on Docker and Kubernetes practice challenges with hints, validation, and explained solutions.",
};

export default function ChallengesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Challenges"
        description="Short, practical missions. Each has optional hints and an explained solution, and earns 30 XP the first time you complete it."
      />
      <ChallengeCatalog />
    </>
  );
}
