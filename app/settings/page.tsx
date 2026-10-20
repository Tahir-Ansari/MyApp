import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Preferences, offline and install options, how your progress is stored, and progress reset.",
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="You" title="Settings" description="Preferences, offline use, and how your progress is stored on this device." />
      <SettingsView />
    </>
  );
}
