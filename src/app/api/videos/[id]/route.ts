import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bucket, s3 } from "@/lib/s3";
import { isVideoId, videoKey } from "@/lib/videos";

async function findOwnVideo(ctx: RouteContext<"/api/videos/[id]">) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id } = await ctx.params;
  if (!isVideoId(id)) return null;
  const video = await prisma.video.findUnique({ where: { id } });
  return video && video.userId === user.id ? video : null;
}

// Redirects to a temporary bucket URL so the video streams from storage, not this server.
export async function GET(_request: Request, ctx: RouteContext<"/api/videos/[id]">) {
  const video = await findOwnVideo(ctx);
  if (!video || !video.uploaded) return new Response("Not found", { status: 404 });

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: videoKey(video.id) }),
    { expiresIn: 3600 },
  );
  return Response.redirect(url, 302);
}

// Called by the browser after its direct upload finishes; confirms the file landed.
export async function PATCH(_request: Request, ctx: RouteContext<"/api/videos/[id]">) {
  const video = await findOwnVideo(ctx);
  if (!video) return new Response("Not found", { status: 404 });

  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: videoKey(video.id) }));
  } catch {
    return Response.json({ error: "Upload not found." }, { status: 409 });
  }
  await prisma.video.update({ where: { id: video.id }, data: { uploaded: true } });
  return Response.json({ ok: true });
}
