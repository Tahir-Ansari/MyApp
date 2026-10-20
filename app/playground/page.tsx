import type { Metadata } from "next";
import { Playground } from "@/components/playground/playground";
import { PageHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Playground",
  description: "Practise Docker and kubectl commands in a safe, simulated terminal that runs entirely in your browser.",
};

export default function PlaygroundPage() {
  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Command playground"
        description="Try Docker and Kubernetes commands without installing anything. The simulated environment remembers what you do until you reset it."
      />
      <Playground />
    </>
  );
}
