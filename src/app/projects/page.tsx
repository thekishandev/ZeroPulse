import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StatusDot } from "@/components/Logo";
import { IconArrowRight } from "@/components/icons";
import { listProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Projects</h1>
            <p className="mt-1 text-[13px] text-ink-mute">
              Every Zerops project connected to ZeroPulse.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-gradient-to-r from-public to-private px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-public/20 transition-transform hover:scale-[1.03]"
          >
            Connect new
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="zp-panel rounded-2xl px-6 py-16 text-center">
            <p className="text-sm text-ink-dim">No projects connected yet.</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-public hover:underline"
            >
              Connect your first project <IconArrowRight width={15} height={15} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/${p.id}`}
                className="zp-panel zp-panel-hover group flex flex-col justify-between rounded-2xl p-5"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status="RUNNING" size={8} />
                  <span className="truncate text-[15px] font-semibold text-ink">
                    {p.name || p.zeropsProjectId}
                  </span>
                </div>
                <div className="mt-1 truncate zp-mono text-[11px] text-ink-mute">
                  {p.zeropsProjectId}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-md border border-edge bg-base/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-mute">
                    {p.scenario}
                  </span>
                  <span className="text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:text-public">
                    <IconArrowRight width={16} height={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
