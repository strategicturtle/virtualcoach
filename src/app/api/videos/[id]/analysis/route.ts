import Anthropic from "@anthropic-ai/sdk";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUser } from "@/lib/auth";
import { analyzeClip, type Frame } from "@/lib/coaching";
import { CoachingError } from "@/lib/coaching/claude";
import {
  DAILY_ANALYSIS_LIMIT,
  LEVELS,
  MAX_FRAMES,
  MIN_FRAMES,
  POSITIONS,
  SKILLS,
} from "@/lib/coaching/options";
import { prisma } from "@/lib/prisma";
import { bucket, s3 } from "@/lib/s3";
import { isVideoId, videoKey } from "@/lib/videos";

const MAX_FRAME_BASE64 = 400_000; // ~300 KB JPEG; frames are ~768px so real ones are far smaller

function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

function parseFrames(value: unknown): Frame[] | null {
  if (!Array.isArray(value) || value.length < MIN_FRAMES || value.length > MAX_FRAMES) return null;
  const frames: Frame[] = [];
  for (const f of value) {
    if (
      typeof f?.t !== "number" ||
      !Number.isFinite(f.t) ||
      typeof f?.jpegBase64 !== "string" ||
      f.jpegBase64.length > MAX_FRAME_BASE64 ||
      !/^[A-Za-z0-9+/]+=*$/.test(f.jpegBase64)
    ) {
      return null;
    }
    frames.push({ t: f.t, jpegBase64: f.jpegBase64 });
  }
  return frames;
}

// Runs AI coaching on one of the player's clips using frames sampled in the browser.
export async function POST(request: Request, ctx: RouteContext<"/api/videos/[id]/analysis">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Log in to get coaching." }, { status: 401 });

  const { id } = await ctx.params;
  const video = isVideoId(id) ? await prisma.video.findUnique({ where: { id } }) : null;
  if (!video || video.userId !== user.id || !video.uploaded) {
    return Response.json({ error: "Video not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { skill, position, level } = body ?? {};
  const frames = parseFrames(body?.frames);
  if (!includes(SKILLS, skill) || !includes(POSITIONS, position) || !includes(LEVELS, level)) {
    return Response.json({ error: "Pick a skill, position, and level." }, { status: 400 });
  }
  if (!frames) {
    return Response.json({ error: "Couldn't read frames from this video." }, { status: 400 });
  }

  const since = new Date(Date.now() - 24 * 3_600_000);
  const used = await prisma.analysis.count({ where: { userId: user.id, createdAt: { gte: since } } });
  if (used >= DAILY_ANALYSIS_LIMIT) {
    return Response.json(
      { error: `You've used all ${DAILY_ANALYSIS_LIMIT} coaching reviews for today. Try again tomorrow.` },
      { status: 429 },
    );
  }

  await prisma.user.update({ where: { id: user.id }, data: { position, level } });

  const videoUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: videoKey(video.id) }),
    { expiresIn: 3600 },
  );

  try {
    const result = await analyzeClip({ skill, position, level, seconds: video.seconds, frames, videoUrl });
    const analysis = await prisma.analysis.create({
      data: {
        videoId: video.id,
        userId: user.id,
        skill,
        position,
        level,
        report: result.report,
        frameCount: frames.length,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
    });
    return Response.json({ analysis });
  } catch (err) {
    if (err instanceof CoachingError) {
      return Response.json({ error: err.message }, { status: 422 });
    }
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
      console.error("Coaching API busy:", err.message);
      return Response.json({ error: "The coach is busy right now. Try again in a minute." }, { status: 503 });
    }
    console.error("Coaching failed:", err);
    return Response.json({ error: "Coaching failed. Try again in a few minutes." }, { status: 500 });
  }
}
