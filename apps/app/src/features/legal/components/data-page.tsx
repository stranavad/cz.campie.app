import { LegalDocumentView } from '@/features/legal/components/legal-document/legal-document-view';
import { ProcessorList } from '@/features/legal/components/processor-list';

// Where data is stored, who processes it, what is encrypted and what the operator can reach.
export function DataPage() {
  return (
    <LegalDocumentView document="dataPage">
      <ProcessorList />
    </LegalDocumentView>
  );
}
