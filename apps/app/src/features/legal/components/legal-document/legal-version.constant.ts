import { CURRENT_LEGAL_VERSIONS } from '@repo/schema/organisations';

// The version signup accepts of each contract; the data page and the privacy policy are not accepted.
export const LEGAL_VERSION_OF = {
  terms: CURRENT_LEGAL_VERSIONS.terms,
  dataProcessingAgreement: CURRENT_LEGAL_VERSIONS.data_processing_agreement,
  dataPage: null,
  privacy: null,
} as const;
