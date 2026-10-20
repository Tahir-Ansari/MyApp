import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/learning/lesson-player";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLesson, getLessonEntry, LESSON_ENTRIES } from "@/lib/curriculum";

export function generateStaticParams() {
  return LESSON_ENTRIES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/lesson/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = getLessonEntry(slug);
  if (!entry) return { title: "Lesson not found" };
  return { title: entry.title, description: entry.summary };
}

export default async function LessonPage({ params }: PageProps<"/lesson/[slug]">) {
  const { slug } = await params;
  const entry = getLessonEntry(slug);
  if (!entry) notFound();
  const lesson = getLesson(slug);
  if (!lesson) {
    return (
      <Card className="bg-grid p-5 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-strong">Lesson {entry.number}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{entry.title}</h1>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted">This lesson&apos;s content is still being written. Check back shortly.</p>
        <Button asChild variant="secondary" className="mt-5">
          <Link href="/learn">Back to the learning path</Link>
        </Button>
      </Card>
    );
  }
  return <LessonPlayer lesson={lesson} />;
}
