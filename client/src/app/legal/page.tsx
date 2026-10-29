import type { Metadata } from "next";
import Link from "next/link";
import { legalConfig } from "@/config/legal.config";
import { formatRussianDate } from "@/lib/legal/format";
import { getLegalDocuments } from "@/lib/legal/registry";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Юридические документы — TodoList",
  description:
    "Политика конфиденциальности, согласие на обработку персональных данных, политика cookie и пользовательское соглашение.",
};

export default function LegalIndexPage() {
  return (
    <LegalPageLayout backHref="/" backLabel="Back to app">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3 font-mono">
          Правовая информация
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Юридические документы</h1>
        <p className="text-slate-400">
          Документы сервиса {legalConfig.site.domain}, регулирующие обработку персональных данных и
          условия использования.
        </p>
      </header>

      <ul className="space-y-3">
        {getLegalDocuments().map((doc) => {
          const revision = legalConfig.revisions[doc.slug];
          return (
            <li key={doc.slug}>
              <Link
                href={`/legal/${doc.slug}`}
                className="group flex items-center gap-3 p-5 bg-slate-800/60 border border-slate-700/50 rounded-xl transition-colors hover:border-indigo-500/40"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-1">
                    <h2 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug">
                      {doc.title}
                    </h2>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                      {doc.basis}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{doc.description}</p>
                  {revision && (
                    <p className="text-xs text-slate-500 mt-2">
                      Редакция {revision.version} от{" "}
                      <time dateTime={revision.effectiveDate}>{formatRussianDate(revision.effectiveDate)}</time>
                    </p>
                  )}
                </div>
                <svg
                  className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-indigo-400 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </LegalPageLayout>
  );
}
