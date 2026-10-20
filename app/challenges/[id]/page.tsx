import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { ChallengeRunner } from "@/components/challenges/challenge-runner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHALLENGES, getChallenge } from "@/lib/challenges/definitions";
import { getLessonEntry } from "@/lib/curriculum/catalog";

export function generateStaticParams() {
  return CHALLENGES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/challenges/[id]">): Promise<Metadata> {
  const { id } = await params;
  const challenge = getChallenge(id);
  return challenge ? { title: challenge.title, description: challenge.goal } : { title: "Challenge not found" };
}

export default async function ChallengePage({ params }: PageProps<"/challenges/[id]">) {
  const { id } = await params;
  const challenge = getChallenge(id);
  if (!challenge) notFound();
  const lesson = getLessonEntry(challenge.relatedLesson);
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
        <Link href="/challenges">
          <ArrowLeft aria-hidden /> All challenges
        </Link>
      </Button>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">Challenge</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{challenge.title}</h1>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted sm:text-base">{challenge.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="outline">{challenge.track === "docker" ? "Docker" : "Kubernetes"}</Badge>
          <Badge tone="outline">{challenge.difficulty === "beginner" ? "Beginner" : "Intermediate"}</Badge>
          <Badge tone="outline">
            <Clock aria-hidden /> ~{challenge.estimatedMinutes} min
          </Badge>
          {lesson ? (
            <Link href={`/lesson/${lesson.slug}`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
              <BookOpen className="size-3.5" aria-hidden /> Related lesson: {lesson.title}
            </Link>
          ) : null}
        </div>
      </header>
      <ChallengeRunner challenge={challenge} />
    </div>
  );
}
