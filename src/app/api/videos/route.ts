import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bucket, s3 } from "@/lib/s3";
import { ALLOWED_TYPES, MAX_RECORDING_SECONDS, MAX_UPLOAD_BYTES, videoKey } from "@/lib/videos";

// Hands the browser a short-lived URL to upload one recording straight to the bucket.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Log in to save videos." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const contentType = body?.contentType;
  const size = body?.size;
  const seconds = body?.seconds;

  if (!ALLOWED_TYPES.includes(contentType)) {
    return Response.json({ error: "Unsupported video type." }, { status: 400 });
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "Video is too large." }, { status: 400 });
  }
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > MAX_RECORDING_SECONDS) {
    return Response.json({ error: "Invalid video length." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await prisma.video.create({ data: { id, userId: user.id, contentType, seconds } });

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: videoKey(id),
      ContentType: contentType,
      ContentLength: size,
    }),
    { expiresIn: 600 },
  );

  return Response.json({ id, uploadUrl });
}
