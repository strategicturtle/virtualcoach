import { ImageResponse } from "next/og";

const GOLD_SHINE = "linear-gradient(180deg, #fff6cf 0%, #ffe07a 40%, #f2c341 70%, #d9a521 100%)";

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
          background: "#0a0a0a",
          fontSize: size * 0.45,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            backgroundImage: GOLD_SHINE,
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          VC
        </span>
      </div>
    ),
    { width: size, height: size },
  );
}
