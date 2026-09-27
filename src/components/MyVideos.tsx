"use client";

import Link from "next/link";
import { useMyVideos } from "@/lib/myVideos";

export default function MyVideos() {
  const videos = useMyVideos();
  if (videos.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Your videos</h2>
      <ul className="mt-3 divide-y divide-white/10 rounded-xl bg-surface">
        {videos.map((v) => (
          <li key={v.id}>
            <Link
              href={`/watch/${v.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
            >
              <span>
                {new Date(v.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span className="text-muted">{v.seconds}s ›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
