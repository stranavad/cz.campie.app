import { useMutation } from '@tanstack/react-query';
import { CircleCheckIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ProblemFormProps {
  // Sends the text, and the address to answer when one is asked for.
  send: (text: string, email: string) => Promise<unknown>;
  askEmail: boolean;
  // The link that opens the form.
  label: string;
  // The dialog's heading and the line under it.
  title: string;
  description: string;
}

// A link that opens a small dialog to tell the platform's people about a problem. Closing it starts the
// next message afresh.
export function ProblemForm({ send, askEmail, label, title, description }: ProblemFormProps) {
  const { t } = useTranslation();
  const id = useId();
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const sending = useMutation({ mutationFn: () => send(text, email) });

  return (
    <Dialog
      onOpenChange={(open) => {
        // A message sent last time (even one finished after the dialog closed) leaves room for a new one.
        if (open && sending.isSuccess) {
          setText('');
          setEmail('');
          sending.reset();
        }
      }}
    >
      <DialogTrigger className="cursor-pointer rounded-sm text-left underline underline-offset-4 transition-colors hover:text-foreground">
        {label}
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-1">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>
        {sending.isSuccess ? (
          <>
            <output>
              <Alert variant="success">
                <CircleCheckIcon aria-hidden="true" />
                {t('feedback.sent')}
              </Alert>
            </output>
            <DialogClose render={<Button className="self-end" />}>{t('feedback.close')}</DialogClose>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              sending.mutate();
            }}
          >
            <Field>
              <FieldLabel htmlFor={`${id}-text`}>{t('feedback.text')}</FieldLabel>
              <Textarea id={`${id}-text`} rows={4} value={text} onChange={(event) => setText(event.target.value)} />
            </Field>
            {askEmail ? (
              <Field>
                <FieldLabel htmlFor={`${id}-email`}>{t('feedback.email')}</FieldLabel>
                <Input
                  id={`${id}-email`}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
            ) : null}
            {sending.isError ? (
              <Alert variant="danger" role="alert">
                {t('feedback.failed')}
              </Alert>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <DialogClose render={<Button type="button" variant="ghost" />}>{t('feedback.cancel')}</DialogClose>
              <Button type="submit" disabled={text.trim().length < 5 || sending.isPending}>
                {t('feedback.send')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
