import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { AchievementsView } from "@/components/achievements/achievements-view";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Your level, XP, badges, and learning milestones, saved on this device.",
};

export default function AchievementsPage() {
  return (
    <>
      <PageHeader eyebrow="Progress" title="Achievements" description="Your level, XP and badges. Everything here is saved on this device." />
      <AchievementsView />
    </>
  );
}
