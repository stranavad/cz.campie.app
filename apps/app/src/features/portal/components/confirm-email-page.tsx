import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useConfirmEmailChangeMutation } from '@/features/portal/api/portal.queries';

// Makes a new guardian email theirs, on a click, so a mail scanner opening the link changes nothing.
export function ConfirmEmailPage({ token }: { token: string }) {
  const { t } = useTranslation('portal');
  const confirm = useConfirmEmailChangeMutation();

  return (
    <section className="flex max-w-sm flex-col gap-6 py-12">
      <h1 className="text-2xl font-semibold">{t('confirmEmail.title')}</h1>
      {confirm.isSuccess ? (
        <output>{t('confirmEmail.done')}</output>
      ) : confirm.isError || token === '' ? (
        <p role="alert" className="text-sm text-destructive">
          {t('confirmEmail.invalid')}
        </p>
      ) : (
        <Button type="button" className="self-start" disabled={confirm.isPending} onClick={() => confirm.mutate(token)}>
          {t('confirmEmail.confirm')}
        </Button>
      )}
    </section>
  );
}
