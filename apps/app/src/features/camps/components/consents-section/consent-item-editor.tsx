import { useTranslation } from 'react-i18next';

import { CONSENT_ITEM_KINDS, type ConsentItem, type ConsentItemKind } from '@repo/schema/consents';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ConsentItemEditorProps {
  item: ConsentItem;
  canRemove: boolean;
  onText: (text: string) => void;
  onKind: (kind: ConsentItemKind) => void;
  onRemove: () => void;
}

// One item of a Consent: its text and how guardians answer it.
export function ConsentItemEditor({ item, canRemove, onText, onKind, onRemove }: ConsentItemEditorProps) {
  const { t } = useTranslation('camps');

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-muted p-3">
      <Textarea
        aria-label={t('consents.itemText')}
        rows={2}
        className="min-h-16"
        value={item.text}
        onChange={(event) => onText(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={t('consents.kind')}
          className="sm:max-w-56"
          value={item.kind}
          onValueChange={onKind}
          options={CONSENT_ITEM_KINDS.map((kind) => ({ value: kind, label: t(`consents.kinds.${kind}`) }))}
        />
        {canRemove ? (
          <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
            {t('consents.removeItem')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
