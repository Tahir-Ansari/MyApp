import type { Metadata } from "next";
import { TrackMap } from "@/components/learning/track-map";
import { PageHeader } from "@/components/ui/card";
import { TRACKS } from "@/lib/curriculum/catalog";

export const metadata: Metadata = {
  title: "Docker Foundations",
  description: TRACKS.docker.description,
};

export default function DockerPathPage() {
  return (
    <>
      <PageHeader eyebrow="Track A" title={TRACKS.docker.title} description={TRACKS.docker.description} />
      <TrackMap track="docker" />
    </>
  );
}
