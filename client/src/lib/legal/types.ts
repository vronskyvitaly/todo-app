export type OperatorKind = "legal-entity" | "individual-entrepreneur" | "individual";

export interface Operator {
  kind: OperatorKind;
  fullName: string;
  shortName: string;
  inn: string;
  ogrn: string | null;
  kpp?: string | null;
  legalAddress: string;
  actualAddress: string;
}

export interface Contacts {
  email: string;
  privacyEmail: string;
  phone: string;
  postalAddress: string;
}

export interface Site {
  domain: string;
  url: string;
  name: string;
}

export interface RknNotification {
  submitted: boolean;
  registryNumber: string | null;
  registeredAt: string | null;
}

export type LegalBasis =
  | "consent"
  | "contract"
  | "legal-obligation"
  | "legitimate-interest"
  | "public-data";

export interface ProcessingPurpose {
  id: string;
  title: string;
  dataCategories: string[];
  legalBasis: LegalBasis;
  retention: string;
}

export interface Processor {
  name: string;
  purpose: string;
  dataCategories: string[];
  country: string;
}

export type CookieCategory = "essential" | "analytics" | "marketing" | "preferences";

export interface CookieEntry {
  name: string;
  category: CookieCategory;
  provider: string;
  purpose: string;
  lifetime: string;
}

export interface DocumentRevision {
  effectiveDate: string;
  version: string;
}

export interface SiteLegalConfig {
  operator: Operator;
  contacts: Contacts;
  site: Site;
  rkn: RknNotification;
  dataLocalizedInRussia: boolean;
  crossBorderTransfer: { enabled: boolean; countries: string[] };
  dataSubjects: string[];
  purposes: ProcessingPurpose[];
  processors: Processor[];
  cookies: CookieEntry[];
  localStorage: CookieEntry[];
  revisions: Record<string, DocumentRevision>;
}
