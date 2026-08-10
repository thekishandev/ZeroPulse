"use client";

import { useMemo, useState } from "react";
import { ROLE_META, buildEdges, roleOf } from "@/lib/roles";
import type { ZeropsService } from "@/lib/types";
import { ServiceNode } from "./ServiceNode";

const ROLE_ORDER: Record<string, number> = {
  edge: 0,
  app: 1,
  database: 2,
  cache: 3,
  storage: 4,
  worker: 5,
  service: 6,
};

function layout(services: ZeropsService[]) {
  const sorted = [...services].sort(
    (a, b) => (ROLE_ORDER[roleOf(a)] ?? 9) - (ROLE_ORDER[roleOf(b)] ?? 9),
  );
  const pub = sorted.filter((s) => s.isPublic);
  const priv = sorted.filter((s) => !s.isPublic);

  const place = (items: ZeropsService[], y: number) => {
    const n = items.length;
    if (n === 0) return [] as { service: ZeropsService; x: number; y: number }[];
    if (n === 1) return [{ service: items[0], x: 50, y }];
    const left = 15;
    const right = 85;
    return items.map((service, i) => ({
      service,
      x: left + ((right - left) * i) / (n - 1),
      y,
    }));
  };

  let publicY = 50;
  let privateY = 50;
  if (pub.length && priv.length) {
    publicY = 28;
    privateY = 74;
  } else if (pub.length) {
    publicY = 50;
  } else {
    privateY = 50;
  }

  return {
    publicNodes: place(pub, publicY),
    privateNodes: place(priv, privateY),
    publicY,
    privateY,
    hasPublic: pub.length > 0,
    hasPrivate: priv.length > 0,
  };
}

export function TopologyGraph({
  services,
  selectedId,
  onSelect,
}: {
  services: ZeropsService[];
  selectedId: string | null;
  onSelect: (s: ZeropsService) => void;
}) {
  const { publicNodes, privateNodes, publicY, privateY, hasPublic, hasPrivate } =
    useMemo(() => layout(services), [services]);

  const edges = useMemo(() => buildEdges(services), [services]);
  const pos = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    [...publicNodes, ...privateNodes].forEach(({ service, x, y }) =>
      map.set(service.id, { x, y }),
    );
    return map;
  }, [publicNodes, privateNodes]);

  const connected = useMemo(() => {
    if (!selectedId) return null;
    const set = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedId) set.add(e.target);
      if (e.target === selectedId) set.add(e.source);
    });
    return set;
  }, [edges, selectedId]);

  if (services.length === 0) {
    return (
      <div className="grid h-[420px] place-items-center rounded-xl border border-dashed border-edge text-ink-mute">
        No services detected for this project.
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/11] w-full min-h-[440px] overflow-hidden rounded-xl border border-edge bg-[#070a18]">
      {/* zone bands */}
      {hasPublic && (
        <div
          className="pointer-events-none absolute left-0 right-0 border-b border-edge/60"
          style={{
            top: 0,
            height: `${(publicY + 16)}%`,
            background:
              "linear-gradient(180deg, rgba(79,140,255,0.08), rgba(79,140,255,0))",
          }}
        >
          <span className="zp-chip absolute left-3 top-3 text-public/80">
            ◢ Public traffic
          </span>
        </div>
      )}
      {hasPrivate && (
        <div
          className="pointer-events-none absolute left-0 right-0"
          style={{
            top: `${hasPublic ? publicY + 16 : 0}%`,
            bottom: 0,
            background:
              "linear-gradient(180deg, rgba(157,92,255,0.06), rgba(157,92,255,0.02))",
            borderTop: hasPublic ? "1px dashed rgba(157,92,255,0.25)" : "none",
          }}
        >
          <span className="zp-chip absolute left-3 top-3 text-private/80">
            ◣ Private network
          </span>
        </div>
      )}

      {/* edges */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="zp-edge-public" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4f8cff" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="zp-edge-private" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9d5cff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#9d5cff" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {edges.map((e) => {
          const a = pos.get(e.source);
          const b = pos.get(e.target);
          if (!a || !b) return null;
          const my = (a.y + b.y) / 2;
          const d = `M ${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
          const isPublic = e.kind === "public";
          const dim = connected
            ? !(e.source === selectedId || e.target === selectedId)
            : false;
          return (
            <path
              key={`${e.source}-${e.target}`}
              d={d}
              className="zp-edge"
              style={{ opacity: dim ? 0.12 : 0.95 }}
              stroke={
                isPublic ? "url(#zp-edge-public)" : "url(#zp-edge-private)"
              }
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {edges
          .filter((e) => e.kind === "private")
          .map((e) => {
            const a = pos.get(e.source);
            const b = pos.get(e.target);
            if (!a || !b) return null;
            const my = (a.y + b.y) / 2;
            const d = `M ${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
            const dim = connected
              ? !(e.source === selectedId || e.target === selectedId)
              : false;
            return (
              <path
                key={`flow-${e.source}-${e.target}`}
                d={d}
                className="zp-edge zp-edge-flow"
                style={{ opacity: dim ? 0 : 0.7 }}
                stroke="#9d5cff"
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
              />
            );
          })}
      </svg>

      {/* nodes */}
      {[...publicNodes, ...privateNodes].map(({ service, x, y }) => {
        const isSel = selectedId === service.id;
        const dimmed = !!connected && !isSel && !connected.has(service.id);
        return (
          <ServiceNode
            key={service.id}
            service={service}
            role={roleOf(service)}
            x={x}
            y={y}
            selected={isSel}
            dimmed={dimmed}
            onSelect={onSelect}
          />
        );
      })}

      {/* legend */}
      <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col gap-1.5 rounded-lg border border-edge bg-base/80 px-3 py-2 text-[10px] backdrop-blur">
        <span className="flex items-center gap-1.5 text-ink-dim">
          <span className="inline-block h-1.5 w-5 rounded-full bg-public" />
          public route
        </span>
        <span className="flex items-center gap-1.5 text-ink-dim">
          <span
            className="inline-block h-1.5 w-5 rounded-full"
            style={{
              background:
                "repeating-linear-gradient(90deg,#9d5cff 0 4px,transparent 4px 7px)",
            }}
          />
          private network
        </span>
      </div>
    </div>
  );
}

export { ROLE_META };
