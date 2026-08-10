import type { CSSProperties } from "react";

/**
 * ZeroPulse wordmark + heartbeat glyph.
 * Pure SVG, no assets, animates the pulse line.
 */
export function Logo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className="relative grid place-items-center rounded-xl"
        style={{
          width: size + 8,
          height: size + 8,
          background:
            "linear-gradient(135deg, rgba(79,140,255,0.25), rgba(157,92,255,0.25))",
          border: "1px solid var(--color-edge)",
        }}
      >
        <svg width={size} height={size * 0.7} viewBox="0 0 40 28" fill="none" aria-hidden>
          <defs>
            <linearGradient id="zp-pulse-grad" x1="0" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22d39a" />
              <stop offset="0.5" stopColor="#4f8cff" />
              <stop offset="1" stopColor="#9d5cff" />
            </linearGradient>
          </defs>
          <path
            className="zp-pulse-line"
            d="M2 14 H12 L16 4 L21 24 L25 14 H38"
            stroke="url(#zp-pulse-grad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {withText && (
        <span className="font-semibold tracking-tight text-[1.05rem] text-ink">
          Zero<span className="text-public">Pulse</span>
        </span>
      )}
    </span>
  );
}

export function StatusDot({
  status,
  size = 8,
  style,
}: {
  status: "RUNNING" | "FAILED" | "BUILDING" | "STOPPED" | "DEPLOYING";
  size?: number;
  style?: CSSProperties;
}) {
  const color =
    status === "RUNNING"
      ? "var(--color-ok)"
      : status === "FAILED"
        ? "var(--color-error)"
        : status === "BUILDING" || status === "DEPLOYING"
          ? "var(--color-warn)"
          : "var(--color-ink-mute)";
  return (
    <span className="relative inline-flex" style={{ width: size, height: size, ...style }}>
      {status === "RUNNING" && (
        <span
          className="zp-pulse"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "9999px",
            background: color,
            opacity: 0.5,
          }}
        />
      )}
      <span
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "9999px",
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </span>
  );
}
