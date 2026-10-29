import Link from "next/link";
import type { ReactNode } from "react";

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

export default function LegalPageLayout({
  backHref,
  backLabel,
  children,
}: {
  backHref: string;
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <nav className="mb-10">
          <BackLink href={backHref} label={backLabel} />
        </nav>
        {children}
      </div>
    </main>
  );
}
