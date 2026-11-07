import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProblemFormProps {
  // Sends the text, and the address to answer when one is asked for.
  send: (text: string, email: string) => Promise<unknown>;
  askEmail: boolean;
  label: string;
}

// A small form to tell the platform's people about a problem; it opens from a link.
export function ProblemForm({ send, askEmail, label }: ProblemFormProps) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const sending = useMutation({ mutationFn: () => send(text, email) });

  if (!isOpen) {
    return (
      <button type="button" className="underline" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  if (sending.isSuccess) {
    return <output className="block">{t('feedback.sent')}</output>;
  }

  return (
    <form
      className="flex w-full max-w-md flex-col gap-2 text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        sending.mutate();
      }}
    >
      <label className="flex flex-col gap-1">
        {t('feedback.text')}
        <textarea
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base md:text-sm"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      {askEmail ? (
        <label className="flex flex-col gap-1">
          {t('feedback.email')}
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={text.trim().length < 5 || sending.isPending}>
          {t('feedback.send')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          {t('feedback.cancel')}
        </Button>
      </div>
      {sending.isError ? (
        <p role="alert" className="text-destructive">
          {t('feedback.failed')}
        </p>
      ) : null}
    </form>
  );
}
