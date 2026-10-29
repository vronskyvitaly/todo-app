import type { CookieCategory, LegalBasis, Operator } from "./types";

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
] as const;

export function formatRussianDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  const monthName = MONTHS_GENITIVE[Number(month) - 1];
  if (!monthName) return iso;
  return `${Number(day)} ${monthName} ${year} г.`;
}

const LEGAL_BASIS_LABELS: Record<LegalBasis, string> = {
  consent: "согласие субъекта (п. 1 ч. 1 ст. 6 152-ФЗ)",
  contract: "исполнение договора (п. 5 ч. 1 ст. 6 152-ФЗ)",
  "legal-obligation": "обязанность по закону (п. 2 ч. 1 ст. 6 152-ФЗ)",
  "legitimate-interest": "законный интерес Оператора (п. 7 ч. 1 ст. 6 152-ФЗ)",
  "public-data": "общедоступные данные (п. 10 ч. 1 ст. 6 152-ФЗ)",
};

export function legalBasisLabel(basis: LegalBasis): string {
  return LEGAL_BASIS_LABELS[basis];
}

const COOKIE_CATEGORY_LABELS: Record<CookieCategory, string> = {
  essential: "Технические",
  analytics: "Аналитические",
  marketing: "Рекламные",
  preferences: "Пользовательские настройки",
};

export function cookieCategoryLabel(category: CookieCategory): string {
  return COOKIE_CATEGORY_LABELS[category];
}

export function requiresConsent(category: CookieCategory): boolean {
  return category !== "essential";
}

export function operatorCredentials(operator: Operator): string {
  const parts = [operator.shortName, `ИНН ${operator.inn}`];
  if (operator.ogrn) {
    parts.push(`${operator.kind === "legal-entity" ? "ОГРН" : "ОГРНИП"} ${operator.ogrn}`);
  }
  if (operator.kpp) parts.push(`КПП ${operator.kpp}`);
  return parts.join(", ");
}
