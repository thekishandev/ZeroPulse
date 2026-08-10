"use client";

import { useState } from "react";
import { TopologyGraph } from "./TopologyGraph";
import type { ZeropsService } from "@/lib/types";

/** Read-only topology used in marketing/preview surfaces. */
export function TopologyPreview({ services }: { services: ZeropsService[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <TopologyGraph
      services={services}
      selectedId={selectedId}
      onSelect={(s) => setSelectedId((cur) => (cur === s.id ? null : s.id))}
    />
  );
}
