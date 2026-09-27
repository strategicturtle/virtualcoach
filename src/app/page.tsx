import Link from "next/link";
import MyVideos from "@/components/MyVideos";
import { MAX_RECORDING_SECONDS } from "@/lib/videos";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-gold-shine sm:text-5xl">
        VirtualCoach
      </h1>
      <p className="mt-2 text-lg text-muted">Your lacrosse coach, anywhere.</p>

      <Link
        href="/record"
        className="group mt-10 flex items-center gap-5 rounded-2xl border-2 border-neon bg-surface p-6 transition hover:bg-neon/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neon/50 sm:p-8"
      >
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-neon text-black sm:size-20">
          <svg viewBox="0 0 24 24" className="size-8 sm:size-10" fill="currentColor" aria-hidden>
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v1.3l3.4-2.2A1 1 0 0 1 21 6.4v11.2a1 1 0 0 1-1.6.8L16 16.2v1.3a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 17.5v-11Z" />
          </svg>
        </span>
        <span>
          <span className="block text-2xl font-bold sm:text-3xl">Record yourself playing</span>
          <span className="mt-1 block text-muted">
            Film a {MAX_RECORDING_SECONDS}-second clip with your camera.
          </span>
        </span>
      </Link>

      <MyVideos />
    </main>
  );
}
