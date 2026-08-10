"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCENARIOS } from "@/lib/mockData";
import type { ScenarioId } from "@/lib/mockData";
import { IconArrowRight } from "./icons";

export function ConnectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [token, setToken] = useState("");
  const [scenario, setScenario] = useState<ScenarioId>("zeropulse");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const pid = projectId.trim() || `demo-${scenario}`;
    setBusy(true);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zeropsProjectId: pid,
          zeropsToken: token.trim(),
          name: name.trim() || SCENARIOS.find((s) => s.id === scenario)!.name,
          scenario,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect");
      router.push(`/dashboard/${data.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-edge bg-base/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-mute outline-none transition-colors focus:border-public/70 focus:bg-base";

  return (
    <form onSubmit={submit} className="zp-panel rounded-2xl p-5">
      <div className="space-y-3">
        <div>
          <label className="zp-chip mb-1.5 block text-ink-mute">Project name</label>
          <input
            className={inputCls}
            placeholder="My Zerops app"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="zp-chip mb-1.5 block text-ink-mute">Zerops Project ID</label>
            <input
              className={inputCls}
              placeholder="prj_abc123"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
          <div>
            <label className="zp-chip mb-1.5 block text-ink-mute">
              API token <span className="normal-case text-ink-mute/70">(optional)</span>
            </label>
            <input
              className={`${inputCls} zp-mono`}
              placeholder="read-only token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="zp-chip mb-2 block text-ink-mute">Demo dataset</label>
        <div className="grid gap-2 sm:grid-cols-3">
          {SCENARIOS.map((s) => {
            const active = scenario === s.id;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  active
                    ? "border-public/70 bg-public/10"
                    : "border-edge bg-base/40 hover:border-edge/90"
                }`}
              >
                <div className="text-[13px] font-semibold text-ink">{s.name}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-ink-mute">
                  {s.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-[12px] text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-public to-private py-3 text-sm font-semibold text-white shadow-lg shadow-public/20 transition-all hover:scale-[1.01] disabled:opacity-60"
      >
        {busy ? "Connecting…" : "Connect project"}
        {!busy && <IconArrowRight width={16} height={16} />}
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-mute">
        No token? Demo mode loads representative service data — the graph, cache and
        advisor work identically. Add a read-only token with{" "}
        <code className="zp-mono text-ink-dim">MOCK_MODE=false</code> to read live state.
      </p>
    </form>
  );
}
