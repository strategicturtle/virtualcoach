import Link from "next/link";
import { notFound } from "next/navigation";
import { isVideoId } from "@/lib/videos";

export default async function WatchPage({ params }: PageProps<"/watch/[id]">) {
  const { id } = await params;
  if (!isVideoId(id)) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
      <Link href="/" className="text-gold hover:underline">
        ‹ Home
      </Link>
      <video
        src={`/api/videos/${id}`}
        controls
        playsInline
        className="mt-4 max-h-[75dvh] w-full rounded-xl bg-black"
      />
      <Link
        href="/record"
        className="mt-6 self-start rounded-full bg-neon px-6 py-3 font-bold text-black hover:brightness-110"
      >
        Record another
      </Link>
    </main>
  );
}
