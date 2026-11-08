import { LegalDocumentView } from '@/features/legal/components/legal-document/legal-document-view';

// The data processing agreement (GDPR art. 28), accepted at signup: the Organisation controls, the operator
// processes.
export function DataProcessingAgreementPage() {
  return <LegalDocumentView document="dataProcessingAgreement" numbered />;
}
