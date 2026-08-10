"use client";

import type { AdvisorResult, Suggestion } from "@/lib/types";
import { IconCheck, IconError, IconSparkles, IconWarn } from "./icons";

const SEV = {
  error: { color: "var(--color-error)", Icon: IconError, label: "Critical" },
  warn: { color: "var(--color-warn)", Icon: IconWarn, label: "Warning" },
  ok: { color: "var(--color-ok)", Icon: IconCheck, label: "Looks good" },
} as const;

function ScoreGauge({ score }: { score: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color =
    score >= 85 ? "var(--color-ok)" : score >= 60 ? "var(--color-warn)" : "var(--color-error)";
  return (
    <div className="relative grid h-[84px] w-[84px] place-items-center">
      <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#1d2347" strokeWidth="7" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold leading-none" style={{ color }}>
          {score}
        </div>
        <div className="text-[8px] uppercase tracking-wider text-ink-mute">score</div>
      </div>
    </div>
  );
}

/** Render a message, turning `backtick` spans into <code> chips. */
function renderMessage(msg: string) {
  return msg.split("`").map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        className="zp-mono rounded bg-edge-soft px-1 py-0.5 text-[11px] text-public"
      >
        {part}
      </code>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function SuggestionCard({ s }: { s: Suggestion }) {
  const { color, Icon, label } = SEV[s.severity];
  return (
    <div
      className="flex gap-3 rounded-lg border border-edge bg-panel/60 p-3.5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <span className="mt-0.5 shrink-0" style={{ color }}>
        <Icon width={16} height={16} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">{s.title}</span>
          {s.service && (
            <code className="rounded bg-edge-soft px-1.5 py-0.5 text-[10px] text-public">
              {s.service}
            </code>
          )}
          <span className="zp-chip" style={{ color }}>
            {label}
          </span>
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">
          {renderMessage(s.message)}
        </p>
      </div>
    </div>
  );
}

export function AdvisorPanel({
  result,
  loading,
}: {
  result: AdvisorResult | null;
  loading: boolean;
}) {
  return (
    <div className="zp-panel rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-private">
            <IconSparkles width={18} height={18} />
          </span>
          <h3 className="text-sm font-semibold tracking-wide text-ink">
            AI ARCHITECTURE ADVISOR
          </h3>
        </div>
        {result && (
          <span className="rounded-md border border-edge bg-base/60 px-2 py-1 text-[10px] uppercase tracking-wider text-ink-mute">
            engine: {result.engine === "openai" ? "GPT-4o-mini" : "rule-based"}
          </span>
        )}
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="zp-shimmer h-14 rounded-lg" />
          ))}
        </div>
      )}

      {!loading && !result && (
        <div className="mt-4 rounded-lg border border-dashed border-edge p-6 text-center">
          <p className="text-sm text-ink-dim">
            Run the advisor to review your service topology and{" "}
            <span className="zp-mono text-ink">zerops.yaml</span> for architecture issues.
          </p>
        </div>
      )}

      {!loading && result && (
        <>
          <div className="mt-4 flex items-center gap-4 rounded-lg border border-edge bg-base/50 p-3.5">
            <ScoreGauge score={result.score} />
            <p className="text-[13px] leading-relaxed text-ink-dim">{result.summary}</p>
          </div>
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {result.suggestions.map((s, i) => (
              <SuggestionCard key={`${s.rule}-${i}`} s={s} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
