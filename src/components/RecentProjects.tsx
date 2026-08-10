"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusDot } from "./Logo";
import { IconArrowRight } from "./icons";

type Project = {
  id: string;
  name: string | null;
  scenario: string;
  zeropsProjectId: string;
  createdAt: string;
};

export function RecentProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]));
  }, []);

  if (projects === null) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="zp-shimmer h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-edge px-4 py-8 text-center text-sm text-ink-mute">
        No projects connected yet — connect one above to see it here.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/dashboard/${p.id}`}
          className="zp-panel zp-panel-hover group flex items-center justify-between rounded-xl p-4"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusDot status="RUNNING" size={7} />
              <span className="truncate text-sm font-semibold text-ink">
                {p.name || p.zeropsProjectId}
              </span>
            </div>
            <div className="mt-1 truncate text-[11px] text-ink-mute">
              {p.zeropsProjectId} · {p.scenario}
            </div>
          </div>
          <span className="ml-3 shrink-0 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:text-public">
            <IconArrowRight width={16} height={16} />
          </span>
        </Link>
      ))}
    </div>
  );
}
