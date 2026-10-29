import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalConfig } from "@/config/legal.config";
import { formatRussianDate } from "@/lib/legal/format";
import { getLegalDocument, getLegalDocuments } from "@/lib/legal/registry";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getLegalDocuments().map((doc) => ({ slug: doc.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const doc = getLegalDocument(params.slug);
  if (!doc) return {};
  return { title: `${doc.title} — TodoList`, description: doc.description };
}

export default function LegalDocPage({ params }: Props) {
  const doc = getLegalDocument(params.slug);
  const revision = legalConfig.revisions[params.slug];
  if (!doc || !revision) notFound();

  return (
    <LegalPageLayout backHref="/legal" backLabel="Юридические документы">
      <header className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">{doc.title}</h1>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Редакция: {revision.version}</span>
          <span>
            Действует с:{" "}
            <time dateTime={revision.effectiveDate}>{formatRussianDate(revision.effectiveDate)}</time>
          </span>
        </div>
      </header>

      <article>
        <doc.Component config={legalConfig} />
      </article>
    </LegalPageLayout>
  );
}
