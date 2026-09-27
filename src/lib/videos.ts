export const MAX_RECORDING_SECONDS = 40;
// ~2.5 Mbps * 40s is about 12.5 MB; leave headroom for browsers that ignore the bitrate hint.
export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024;
export const ALLOWED_TYPES = ["video/mp4", "video/webm"] as const;

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isVideoId(id: string) {
  return ID_PATTERN.test(id);
}

export function videoKey(id: string) {
  return `videos/${id}`;
}
