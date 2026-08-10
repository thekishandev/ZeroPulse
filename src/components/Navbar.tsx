"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "Connect" },
  { href: "/projects", label: "Projects" },
  { href: "/#how", label: "How it works" },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-edge/70 bg-base/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href.split("#")[0]) && l.href !== "/";
            return (
              <Link
                key={l.label}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active && l.href !== "/#how"
                    ? "bg-panel-2 text-ink"
                    : "text-ink-dim hover:text-ink hover:bg-panel-2/60"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <Link
          href="/"
          className="rounded-lg bg-gradient-to-r from-public to-private px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-public/20 transition-transform hover:scale-[1.03]"
        >
          New project
        </Link>
      </nav>
    </header>
  );
}
