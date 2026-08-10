"use client";

import type { Role } from "@/lib/roles";
import { ROLE_META } from "@/lib/roles";
import type { ZeropsService } from "@/lib/types";
import { StatusDot } from "./Logo";

export function ServiceNode({
  service,
  role,
  x,
  y,
  selected,
  dimmed,
  onSelect,
}: {
  service: ZeropsService;
  role: Role;
  x: number;
  y: number;
  selected: boolean;
  dimmed: boolean;
  onSelect: (s: ZeropsService) => void;
}) {
  const meta = ROLE_META[role];
  const accent = service.isPublic ? "var(--color-public)" : "var(--color-private)";

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className="zp-mono group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-xl p-[1px] text-left transition-all duration-200"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: 158,
        opacity: dimmed ? 0.32 : 1,
        transform: `translate(-50%,-50%) scale(${selected ? 1.05 : 1})`,
        background: selected
          ? `linear-gradient(135deg, ${accent}, ${accent}55)`
          : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0))",
        zIndex: selected ? 20 : 10,
      }}
    >
      <div
        className="rounded-[11px] bg-[#0c1024]/95 px-3 py-2.5 backdrop-blur-sm"
        style={{
          boxShadow: selected
            ? `0 0 0 1px ${accent}, 0 14px 40px -12px ${accent}`
            : `0 0 0 1px ${service.isPublic ? "rgba(79,140,255,0.35)" : "rgba(157,92,255,0.35)"}`,
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="grid h-6 w-6 place-items-center rounded-md text-[13px]"
            style={{ background: `${accent}22` }}
          >
            {meta.emoji}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[8.5px] tracking-[0.14em]"
            style={{
              color: accent,
              background: `${accent}1a`,
              border: `1px solid ${accent}40`,
            }}
          >
            {service.isPublic ? "PUBLIC" : "PRIVATE"}
          </span>
        </div>
        <div className="mt-2 truncate text-[13px] font-semibold text-ink">
          {service.name}
        </div>
        <div className="truncate text-[10.5px] text-ink-mute">{service.type}</div>
        <div className="mt-2 flex items-center gap-1.5">
          <StatusDot status={service.status} size={7} />
          <span className="text-[10px] text-ink-dim">{service.status}</span>
          {service.instances ? (
            <span className="ml-auto text-[9.5px] text-ink-mute">
              ×{service.instances}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
