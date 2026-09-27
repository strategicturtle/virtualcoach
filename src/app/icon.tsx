import { ImageResponse } from "next/og";

const SIZES = [32, 192, 512];

export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14532d",
          color: "#ffffff",
          fontSize: size * 0.45,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        VC
      </div>
    ),
    { width: size, height: size },
  );
}
