import Link from "next/link";
import { notFound } from "next/navigation";
import Coach, { type SavedAnalysis } from "@/components/Coach";
import { requireUser } from "@/lib/auth";
import type { CoachingContext } from "@/lib/coaching/options";
import type { CoachingReport } from "@/lib/coaching/report";
import { prisma } from "@/lib/prisma";
import { isVideoId } from "@/lib/videos";

export default async function WatchPage({ params }: PageProps<"/watch/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  if (!isVideoId(id)) notFound();
  const video = await prisma.video.findUnique({
    where: { id },
    include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!video || video.userId !== user.id || !video.uploaded) notFound();

  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { position: true, level: true } });
  const latest = video.analyses[0];
  const initial: SavedAnalysis | null = latest
    ? {
        skill: latest.skill as CoachingContext["skill"],
        position: latest.position as CoachingContext["position"],
        level: latest.level as CoachingContext["level"],
        report: latest.report as CoachingReport,
        frameCount: latest.frameCount,
        createdAt: latest.createdAt.toISOString(),
      }
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
      <Link href="/" className="text-gold hover:underline">
        ‹ Home
      </Link>
      <video
        src={`/api/videos/${id}`}
        controls
        playsInline
        className="mt-4 max-h-[60dvh] w-full rounded-xl bg-black"
      />
      <Coach
        videoId={id}
        seconds={video.seconds}
        initial={initial}
        defaults={{
          position: (me?.position ?? undefined) as CoachingContext["position"] | undefined,
          level: (me?.level ?? undefined) as CoachingContext["level"] | undefined,
        }}
      />
      <Link
        href="/record"
        className="mt-8 self-start rounded-full bg-neon px-6 py-3 font-bold text-black hover:brightness-110"
      >
        Record another
      </Link>
    </main>
  );
}
