"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AdvisorResult, DataSource, ZeropsService } from "@/lib/types";
import { ROLE_META, roleOf } from "@/lib/roles";
import { AdvisorPanel } from "./AdvisorPanel";
import { TopologyGraph } from "./TopologyGraph";
import { StatusDot } from "./Logo";
import {
  IconArrowRight,
  IconBolt,
  IconClock,
  IconCopy,
  IconExternal,
  IconLayers,
  IconNetwork,
  IconRefresh,
  IconShare,
  IconSparkles,
} from "./icons";

interface DashboardProps {
  projectId: string;
  projectName: string | null;
  scenario: string;
  mockMode: boolean;
  initial: {
    services: ZeropsService[];
    yamlText: string;
    source: DataSource;
    fromCache: boolean;
    cacheAgeSeconds: number | null;
  };
}

const SOURCE_META: Record<DataSource, { label: string; color: string }> = {
  live: { label: "Live Zerops API", color: "var(--color-ok)" },
  cache: { label: "Cached", color: "var(--color-public)" },
  demo: { label: "Demo data", color: "var(--color-warn)" },
  "demo-fallback": { label: "Demo (live failed)", color: "var(--color-warn)" },
};

export function Dashboard({
  projectId,
  projectName,
  scenario,
  mockMode,
  initial,
}: DashboardProps) {
  const [services, setServices] = useState(initial.services);
  const [yamlText, setYamlText] = useState(initial.yamlText);
  const [source, setSource] = useState<DataSource>(initial.source);
  const [cacheAge, setCacheAge] = useState<number | null>(initial.cacheAgeSeconds);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [advisor, setAdvisor] = useState<AdvisorResult | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [share, setShare] = useState<{ url: string } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showYaml, setShowYaml] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/services/${projectId}?refresh=1`);
      const data = await res.json();
      setServices(data.services);
      setYamlText(data.yamlText);
      setSource(data.source);
      setCacheAge(data.cacheAgeSeconds ?? null);
    } finally {
      setRefreshing(false);
    }
  }, [projectId]);

  const runAdvisor = useCallback(async () => {
    setAdvisorLoading(true);
    try {
      const res = await fetch(`/api/advisor/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services, yamlText }),
      });
      const data = await res.json();
      setAdvisor(data as AdvisorResult);
    } finally {
      setAdvisorLoading(false);
    }
  }, [projectId, services, yamlText]);

  // Auto-run the advisor on first load so the dashboard feels alive.
  useEffect(() => {
    runAdvisor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const makeShare = async () => {
    setSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (data.url) {
        setShare({ url: `${window.location.origin}${data.url}` });
      }
    } finally {
      setSharing(false);
    }
  };

  const copyShare = async () => {
    if (!share) return;
    await navigator.clipboard.writeText(share.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const selected = services.find((s) => s.id === selectedId) || null;

  const stats = useMemo(() => {
    const total = services.length;
    const pub = services.filter((s) => s.isPublic).length;
    const healthy = services.filter((s) => s.status === "RUNNING").length;
    return { total, pub, private: total - pub, healthy };
  }, [services]);

  const src = SOURCE_META[source];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/projects"
            className="mb-2 inline-flex items-center gap-1 text-[12px] text-ink-mute transition-colors hover:text-ink"
          >
            ← All projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {projectName}
            </h1>
            <span
              className="rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{ borderColor: `${src.color}55`, color: src.color }}
            >
              {src.label}
              {source === "cache" && cacheAge != null ? ` · ${cacheAge}s` : ""}
            </span>
            <span className="rounded-md border border-edge bg-base/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-mute">
              {scenario}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-edge bg-panel px-3.5 py-2 text-sm text-ink-dim transition-colors hover:border-public/60 hover:text-ink disabled:opacity-60"
          >
            <IconRefresh
              width={15}
              height={15}
              className={refreshing ? "zp-spin" : ""}
            />
            Refresh
          </button>
          <button
            onClick={makeShare}
            disabled={sharing}
            className="inline-flex items-center gap-2 rounded-lg border border-edge bg-panel px-3.5 py-2 text-sm text-ink-dim transition-colors hover:border-private/60 hover:text-ink disabled:opacity-60"
          >
            <IconShare width={15} height={15} />
            Share
          </button>
        </div>
      </div>

      {mockMode && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-warn/30 bg-warn/10 px-3.5 py-2.5 text-[12px] text-warn">
          <IconBolt width={15} height={15} className="mt-0.5 shrink-0" />
          <span>
            Demo mode is active — showing representative service data. The
            topology, caching and AI advisor all run exactly as they would against the
            live Zerops API. Set <code className="zp-mono">MOCK_MODE=false</code> with a
            read-only token to read live state.
          </span>
        </div>
      )}

      {/* share banner */}
      {share && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-private/40 bg-private/10 px-4 py-3">
          <IconShare width={16} height={16} className="text-private" />
          <code className="zp-mono flex-1 truncate text-[12.5px] text-ink">
            {share.url}
          </code>
          <button
            onClick={copyShare}
            className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-base/60 px-2.5 py-1.5 text-[12px] text-ink-dim hover:text-ink"
          >
            <IconCopy width={13} height={13} />
            {copied ? "Copied" : "Copy"}
          </button>
          <Link
            href={share.url.replace(window.location.origin, "")}
            className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-base/60 px-2.5 py-1.5 text-[12px] text-ink-dim hover:text-ink"
          >
            <IconExternal width={13} height={13} />
            Open
          </Link>
        </div>
      )}

      {/* graph + side panel */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="zp-panel rounded-2xl p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <IconNetwork width={16} height={16} className="text-public" />
              Service topology
            </h2>
            <span className="zp-chip text-ink-mute">{stats.total} services</span>
          </div>
          <TopologyGraph
            services={services}
            selectedId={selectedId}
            onSelect={(s) => setSelectedId((cur) => (cur === s.id ? null : s.id))}
          />
        </div>

        <div className="space-y-4">
          {/* stats */}
          <div className="zp-panel grid grid-cols-2 gap-px overflow-hidden rounded-2xl">
            <Stat label="Services" value={stats.total} icon={<IconLayers width={14} height={14} />} />
            <Stat label="Healthy" value={`${stats.healthy}/${stats.total}`} icon={<StatusDot status="RUNNING" size={8} />} />
            <Stat label="Public" value={stats.pub} color="var(--color-public)" />
            <Stat label="Private" value={stats.private} color="var(--color-private)" />
          </div>

          {/* selected service detail */}
          <div className="zp-panel rounded-2xl p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-mute">
              {selected ? "Selected service" : "Inspector"}
            </h3>
            {selected ? (
              <ServiceDetail service={selected} />
            ) : (
              <p className="text-[12.5px] leading-relaxed text-ink-mute">
                Click any node in the topology to inspect its role, ports and resource
                allocation. Public services are routed over HTTP; private ones live on
                the Zerops internal network.
              </p>
            )}
          </div>

          {/* cache status */}
          <div className="zp-panel flex items-center gap-3 rounded-2xl p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-public/15 text-public">
              <IconClock width={16} height={16} />
            </span>
            <div>
              <div className="text-[13px] font-semibold text-ink">
                {source === "cache" ? "Served from cache" : "Fresh fetch"}
              </div>
              <div className="text-[11px] text-ink-mute">
                Zerops API responses cached for 60s to stay rate-limit friendly.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* advisor */}
      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Architecture review</h2>
          <button
            onClick={runAdvisor}
            disabled={advisorLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-private to-public px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-private/20 transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            <IconSparkles width={15} height={15} />
            {advisorLoading ? "Reviewing…" : advisor ? "Re-run advisor" : "Run AI advisor"}
          </button>
        </div>
        <AdvisorPanel result={advisor} loading={advisorLoading} />
      </div>

      {/* yaml preview */}
      <div className="mt-5">
        <button
          onClick={() => setShowYaml((v) => !v)}
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-dim transition-colors hover:text-ink"
        >
          <IconArrowRight
            width={15}
            height={15}
            style={{ transform: showYaml ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
          />
          Generated zerops.yaml
        </button>
        {showYaml && (
          <pre className="zp-mono overflow-x-auto rounded-xl border border-edge bg-[#070a18] p-4 text-[12px] leading-relaxed text-ink-dim">
            {yamlText}
          </pre>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
  color = "var(--color-ink)",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-panel/60 p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-mute">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function ServiceDetail({ service }: { service: ZeropsService }) {
  const role = roleOf(service);
  const meta = ROLE_META[role];
  const accent = service.isPublic ? "var(--color-public)" : "var(--color-private)";
  const rows: { k: string; v: string }[] = [
    { k: "Type", v: service.type },
    { k: "Role", v: meta.label },
    { k: "Visibility", v: service.isPublic ? "Public" : "Private" },
    {
      k: "Ports",
      v: service.ports.length
        ? service.ports.map((p) => `${p.port}${p.httpSupport ? " (http)" : ""}`).join(", ")
        : "internal only",
    },
    { k: "Status", v: service.status },
    { k: "Instances", v: service.instances ? String(service.instances) : "1" },
    { k: "Memory", v: service.memoryMb ? `${service.memoryMb} MB` : "—" },
    { k: "CPU", v: service.cpu || "—" },
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="grid h-9 w-9 place-items-center rounded-lg text-lg"
          style={{ background: `${accent}22` }}
        >
          {meta.emoji}
        </span>
        <div>
          <div className="font-semibold text-ink">{service.name}</div>
          <div className="text-[11px] text-ink-mute">{service.type}</div>
        </div>
        <span className="ml-auto">
          <StatusDot status={service.status} size={9} />
        </span>
      </div>
      <dl className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.k} className="flex justify-between gap-3 text-[12px]">
            <dt className="text-ink-mute">{r.k}</dt>
            <dd className="zp-mono text-right text-ink-dim">{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
