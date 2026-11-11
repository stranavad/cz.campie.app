// What an Owner accepts at signup on behalf of the Organisation.
export const LEGAL_DOCUMENTS = ['terms', 'data_processing_agreement'] as const;

export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number];

// The versions signup offers now. A new text gets a new version here; the accepted one is stored with
// each signup.
export const CURRENT_LEGAL_VERSIONS = {
  terms: '1.0',
  data_processing_agreement: '1.0',
} as const satisfies Record<LegalDocument, string>;
