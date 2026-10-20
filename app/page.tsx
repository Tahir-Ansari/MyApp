import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "See your level, XP, and the next Docker or Kubernetes lesson to learn.",
};

export default function HomePage() {
  return <DashboardView />;
}
