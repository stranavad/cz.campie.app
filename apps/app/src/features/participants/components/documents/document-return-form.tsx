import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DocumentReturnFormProps {
  isBusy: boolean;
  onReturn: (note: string) => void;
}

// Returning a hand-in with the reason the family will read.
export function DocumentReturnForm({ isBusy, onReturn }: DocumentReturnFormProps) {
  const { t } = useTranslation('participants');
  const [note, setNote] = useState('');

  return (
    <form
      className="flex flex-col gap-2 rounded-2xl bg-muted p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onReturn(note);
      }}
    >
      <label className="flex flex-col gap-1.5 font-semibold">
        {t('documents.returnNote')}
        <Input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <Button type="submit" size="sm" className="self-start" disabled={note.trim() === '' || isBusy}>
        {t('documents.returnConfirm')}
      </Button>
    </form>
  );
}
