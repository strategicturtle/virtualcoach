import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { bucket, s3 } from "@/lib/s3";
import { isVideoId, videoKey } from "@/lib/videos";

// Redirects to a temporary bucket URL so the video streams from storage, not this server.
export async function GET(_request: Request, ctx: RouteContext<"/api/videos/[id]">) {
  const { id } = await ctx.params;
  if (!isVideoId(id)) {
    return new Response("Not found", { status: 404 });
  }

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: videoKey(id) }),
    { expiresIn: 3600 },
  );
  return Response.redirect(url, 302);
}
