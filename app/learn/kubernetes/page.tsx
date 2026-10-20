import type { Metadata } from "next";
import { TrackMap } from "@/components/learning/track-map";
import { PageHeader } from "@/components/ui/card";
import { TRACKS } from "@/lib/curriculum/catalog";

export const metadata: Metadata = {
  title: "Kubernetes Adventures",
  description: TRACKS.kubernetes.description,
};

export default function KubernetesPathPage() {
  return (
    <>
      <PageHeader
        eyebrow="Track B"
        title={TRACKS.kubernetes.title}
        description={`${TRACKS.kubernetes.description} Docker Foundations is recommended first, but this track is open from the start.`}
      />
      <TrackMap track="kubernetes" />
    </>
  );
}
