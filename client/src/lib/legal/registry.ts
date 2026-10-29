import type { ComponentType } from "react";
import { CookiePolicy } from "@/legal/cookie-policy";
import { PersonalDataConsent } from "@/legal/personal-data-consent";
import { PrivacyPolicy } from "@/legal/privacy-policy";
import { TermsOfUse } from "@/legal/terms-of-use";
import type { SiteLegalConfig } from "./types";

export interface LegalDocument {
  slug: string;
  title: string;
  description: string;
  Component: ComponentType<{ config: SiteLegalConfig }>;
  basis: string;
}

const ALL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "privacy-policy",
    title: "Политика в отношении обработки персональных данных",
    description:
      "Порядок обработки персональных данных, цели, сроки хранения и права субъекта персональных данных.",
    Component: PrivacyPolicy,
    basis: "ст. 18.1 152-ФЗ",
  },
  {
    slug: "personal-data-consent",
    title: "Согласие на обработку персональных данных",
    description:
      "Самостоятельный документ, на условиях которого пользователь даёт согласие на обработку своих данных при регистрации.",
    Component: PersonalDataConsent,
    basis: "ст. 9 152-ФЗ",
  },
  {
    slug: "cookie-policy",
    title: "Политика использования cookie-файлов",
    description:
      "Какие cookie и данные локального хранилища использует Сервис и зачем.",
    Component: CookiePolicy,
    basis: "ст. 9 152-ФЗ",
  },
  {
    slug: "terms-of-use",
    title: "Пользовательское соглашение",
    description:
      "Условия использования Сервиса, учётная запись, пользовательский контент и ограничение ответственности.",
    Component: TermsOfUse,
    basis: "ст. 435, 1286 ГК РФ",
  },
];

export function getLegalDocuments(): LegalDocument[] {
  return ALL_DOCUMENTS;
}

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return ALL_DOCUMENTS.find((doc) => doc.slug === slug);
}
