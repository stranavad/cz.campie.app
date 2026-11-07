import type { ChecklistItem } from '@repo/schema/checklist';

// The platform's names of the items a child has one of; a Consent or requirement goes by its own name.
const KIND_NAMES = {
  payment: 'Platba',
  missing_answers: 'Doplnit údaje v přihlášce',
  consent: 'Podepsat souhlas',
  health_record: 'Vyplnit zdravotní záznam',
  document: 'Odevzdat dokument',
} as const;

export interface OpenItemsChild {
  readonly name: string;
  readonly items: readonly ChecklistItem[];
}

/**
 * Word an open item as the email lists it.
 * @param item the item
 */
function itemText(item: ChecklistItem): string {
  const name = KIND_NAMES[item.kind];

  if (item.label === null) {
    return name;
  }

  return item.kind === 'document' && item.state === 'returned'
    ? `${name}: ${item.label} (vrácen k opravě)`
    : `${name}: ${item.label}`;
}

// What is still open for each child, below the Camp's own text.
export function OpenItemsBlock({ participants }: { participants: readonly OpenItemsChild[] }) {
  return (
    <div style={{ margin: '12px 0' }}>
      {participants.map((child) => (
        <div key={child.name} style={{ marginBottom: '10px' }}>
          <strong>{child.name}</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
            {child.items.map((item) => (
              <li key={`${item.kind}-${item.key ?? ''}`}>{itemText(item)}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
