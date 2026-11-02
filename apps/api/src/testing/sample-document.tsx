import { DocumentLayout, Fact } from '../core/documents/document-layout.tsx';
import type { DocumentTemplate } from '../core/documents/document.service.ts';

// The pipeline's sample: what a template looks like, until the first real document joins. Camp data
// follows a label, never sits inside a sentence, so it needs no declension.
export const SampleDocument: DocumentTemplate<{ campName: string; turnus: string }> = ({
  letterhead,
  campName,
  turnus,
}) => (
  <DocumentLayout letterhead={letterhead} title="Ukázkový dokument">
    <Fact label="Tábor">{campName}</Fact>
    <Fact label="Turnus">{turnus}</Fact>
    <Fact label="Pořadatel">{letterhead.legalName}</Fact>
    <p style={{ marginTop: '14pt' }}>Tento dokument ověřuje, že se značka a údaje pořadatele propisují do PDF.</p>
  </DocumentLayout>
);
