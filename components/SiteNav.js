"use client";

// SiteNav — responsive header. Desktop: full link row. Mobile: logo + Vet
// button + hamburger that opens a stacked menu. No horizontal overflow at
// any viewport width.
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const LINKS = [
  { href: "/audit", label: "Audit" },
  { href: "/field", label: "The Field" },
  { href: "/mandate", label: "The Mandate" },
  { href: "/feed", label: "The Ledger" },
  { href: "https://github.com/hackid02/vette", label: "GitHub", external: true },
  { href: "https://x.com/vetteagents", label: "X", external: true },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-5 relative">
      <div className="flex items-center justify-between">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        {/* desktop links */}
        <div className="hidden lg:flex items-center gap-6 text-sm text-muted">
          {LINKS.map((l) =>
            l.external ? (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="hover:text-soft transition-colors">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="hover:text-soft transition-colors">
                {l.label}
              </Link>
            )
          )}
          <Link
            href="/audit"
            className="px-4 py-2 rounded-md bg-vet text-ink font-extrabold hover:opacity-90 transition-opacity"
          >
            Vet an agent
          </Link>
        </div>

        {/* mobile: compact CTA + hamburger */}
        <div className="flex lg:hidden items-center gap-2.5">
          <Link
            href="/audit"
            className="px-3.5 py-2 rounded-md bg-vet text-ink font-extrabold text-xs hover:opacity-90 transition-opacity"
          >
            VET →
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] border border-[#23232E] rounded-md bg-[#0E0E15]"
          >
            <span className={`block w-4 h-[2px] bg-soft transition-transform duration-200 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block w-4 h-[2px] bg-soft transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`block w-4 h-[2px] bg-soft transition-transform duration-200 ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* mobile dropdown */}
      {open && (
        <div className="lg:hidden absolute left-4 right-4 top-full z-50 panel p-3 shadow-2xl">
          <div className="flex flex-col">
            {LINKS.map((l) =>
              l.external ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-md text-sm text-soft hover:bg-vet/10 hover:text-vet transition-colors"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-md text-sm text-soft hover:bg-vet/10 hover:text-vet transition-colors"
                >
                  {l.label}
                </Link>
              )
            )}
            <Link
              href="/audit"
              onClick={() => setOpen(false)}
              className="mt-2 px-4 py-3 rounded-md bg-vet text-ink font-extrabold text-sm text-center hover:opacity-90 transition-opacity"
            >
              Vet an agent →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
