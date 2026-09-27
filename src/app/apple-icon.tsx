import { ImageResponse } from "next/og";

const GOLD_SHINE = "linear-gradient(180deg, #fff6cf 0%, #ffe07a 40%, #f2c341 70%, #d9a521 100%)";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 80,
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
    size,
  );
}
