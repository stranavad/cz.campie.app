import { LegalDocumentView } from '@/features/legal/components/legal-document/legal-document-view';

// The terms between the platform operator and the Organisations, accepted at signup.
export function TermsPage() {
  return <LegalDocumentView document="terms" numbered />;
}
