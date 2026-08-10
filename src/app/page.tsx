import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ConnectForm } from "@/components/ConnectForm";
import { RecentProjects } from "@/components/RecentProjects";
import { TopologyPreview } from "@/components/TopologyPreview";
import { Logo } from "@/components/Logo";
import {
  IconBolt,
  IconEye,
  IconLayers,
  IconNetwork,
  IconShield,
  IconSparkles,
} from "@/components/icons";
import { SCENARIOS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: <IconNetwork width={18} height={18} />,
    title: "Live topology graph",
    body: "Every Zerops service auto-rendered as a node — color-coded public vs private, wired with animated private-network edges.",
    color: "var(--color-public)",
  },
  {
    icon: <IconSparkles width={18} height={18} />,
    title: "AI architecture advisor",
    body: "Send your service model + zerops.yaml to an AI reviewer that flags exposed databases, missing httpSupport, and absent cache layers.",
    color: "var(--color-private)",
  },
  {
    icon: <IconShield width={18} height={18} />,
    title: "Private-network aware",
    body: "ZeroPulse understands Zerops's public/private split — and shows you when something sensitive is accidentally exposed.",
    color: "var(--color-ok)",
  },
  {
    icon: <IconBolt width={18} height={18} />,
    title: "Rate-limit friendly cache",
    body: "API responses are cached for 60s and surfaced honestly — the UI tells you whether you're seeing fresh or cached state.",
    color: "var(--color-warn)",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect a project",
    body: "Paste a read-only Zerops token, or use demo mode to load representative service data instantly.",
  },
  {
    n: "02",
    title: "See it render",
    body: "Your services appear as a live topology — public traffic up top, private network below.",
  },
  {
    n: "03",
    title: "Get reviewed",
    body: "Run the AI advisor for a plain-English architecture review, then share a read-only snapshot.",
  },
];

export default function HomePage() {
  const previewServices = SCENARIOS[0].services;

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-5 pt-14 pb-10 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="zp-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-panel/60 px-3 py-1 text-[11px] text-ink-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_8px_var(--color-ok)]" />
              Built for the WeMakeDevs × Zerops Challenge
            </span>
            <h1 className="mt-5 text-[clamp(2.4rem,5.5vw,3.9rem)] font-bold leading-[1.02] tracking-tight text-ink">
              Watch your Zerops
              <br />
              project{" "}
              <span className="bg-gradient-to-r from-public via-ok to-private bg-clip-text text-transparent">
                think.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-dim">
              ZeroPulse connects to your Zerops project, renders its live service
              topology, caches it over the private network, and runs an AI architecture
              review of your <span className="zp-mono text-ink">zerops.yaml</span> — the
              platform watching itself.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] text-ink-mute">
              <span className="flex items-center gap-1.5">
                <IconLayers width={14} height={14} className="text-public" /> 6-service
                stack
              </span>
              <span className="flex items-center gap-1.5">
                <IconSparkles width={14} height={14} className="text-private" /> AI
                advisor
              </span>
              <span className="flex items-center gap-1.5">
                <IconEye width={14} height={14} className="text-ok" /> Shareable
                snapshots
              </span>
            </div>
          </div>

          {/* preview */}
          <div className="zp-fade-up zp-panel rounded-2xl p-4" style={{ animationDelay: "0.1s" }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="zp-chip text-ink-mute">Live preview · ZeroPulse stack</span>
              <span className="zp-chip text-ok">● all running</span>
            </div>
            <TopologyPreview services={previewServices} />
          </div>
        </div>
      </section>

      {/* CONNECT */}
      <section id="connect" className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              Connect a project
            </h2>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-dim">
              Bring your own Zerops project ID + read-only token, or pick a demo dataset
              to explore ZeroPulse end-to-end. No token required.
            </p>
            <div className="mt-6 space-y-3">
              {STEPS.map((s) => (
                <div key={s.n} className="flex gap-3">
                  <span className="zp-mono text-sm font-bold text-public">{s.n}</span>
                  <div>
                    <div className="text-sm font-semibold text-ink">{s.title}</div>
                    <div className="text-[12.5px] text-ink-mute">{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ConnectForm />
        </div>

        <div className="mt-12">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-mute">
            Your projects
          </h3>
          <RecentProjects />
        </div>
      </section>

      {/* FEATURES */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 max-w-xl">
          <span className="zp-chip text-public">Capabilities</span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">
            Everything you want in an infra dashboard
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="zp-panel zp-panel-hover rounded-2xl p-5">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: `${f.color}1f`, color: f.color }}
              >
                {f.icon}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mute">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW ZEROPS IS USED */}
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="zp-panel overflow-hidden rounded-2xl">
          <div className="grid lg:grid-cols-2">
            <div className="p-7">
              <span className="zp-chip text-private">How Zerops is used</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">
                The Zerops project, watching itself
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-ink-dim">
                ZeroPulse reads the Zerops service model, caches results, and turns the
                platform infrastructure concepts — public traffic, private networking,
                managed databases, cache — into a product feature. Its own backend runs as
                the same kind of multi-service stack it audits.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  ["frontend + api", "public, httpSupport enabled"],
                  ["postgresql", "private — stores projects, snapshots, reports"],
                  ["valkey cache", "private — caches Zerops API responses"],
                  ["worker", "private — polls for live state"],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-start gap-2.5 text-[13px]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-public to-private" />
                    <span>
                      <code className="zp-mono text-ink">{k}</code>{" "}
                      <span className="text-ink-mute">— {v}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/#connect"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-public to-private px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-public/20 transition-transform hover:scale-[1.02]"
              >
                Try it now
              </Link>
            </div>
            <div className="border-t border-edge bg-base/40 p-7 lg:border-l lg:border-t-0">
              <ArchDiagram />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-edge/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Logo />
          <p className="text-[12px] text-ink-mute">
            ZeroPulse · Live architecture map + AI advisor for Zerops · Built solo for the
            challenge
          </p>
        </div>
      </footer>
    </>
  );
}

function ArchDiagram() {
  const Node = ({
    label,
    sub,
    color,
  }: {
    label: string;
    sub: string;
    color: string;
  }) => (
    <div
      className="zp-mono rounded-lg border bg-panel/70 px-3 py-2 text-center"
      style={{ borderColor: `${color}55` }}
    >
      <div className="text-[12px] font-semibold" style={{ color }}>
        {label}
      </div>
      <div className="text-[9.5px] text-ink-mute">{sub}</div>
    </div>
  );
  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <div className="zp-chip mb-2 text-public/80">◢ Public traffic</div>
        <div className="grid grid-cols-2 gap-3">
          <Node label="frontend" sub="next.js · public" color="#4f8cff" />
          <Node label="api" sub="node · public" color="#4f8cff" />
        </div>
      </div>
      <div className="flex justify-center text-ink-mute">↓ private network ↓</div>
      <div>
        <div className="zp-chip mb-2 text-private/80">◣ Private network</div>
        <div className="grid grid-cols-3 gap-3">
          <Node label="postgres" sub="private" color="#22d39a" />
          <Node label="valkey" sub="cache" color="#f5b544" />
          <Node label="worker" sub="cron" color="#9d5cff" />
        </div>
      </div>
    </div>
  );
}
