import { Link } from '@tanstack/react-router';
import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useConfirmEmailChangeMutation } from '@/features/portal/api/portal.queries';
import { NoticeCard } from '@/features/portal/components/shared/notice-card';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

interface ConfirmEmailPageProps {
  token: string;
}

// Makes a new guardian email theirs, on a click, so a mail scanner opening the link changes nothing.
export function ConfirmEmailPage({ token }: ConfirmEmailPageProps) {
  const { t } = useTranslation('portal');
  const confirm = useConfirmEmailChangeMutation();

  return (
    <PortalColumn className="max-w-md gap-5 pt-8 sm:pt-14">
      <h1 className="text-title px-1">{t('confirmEmail.title')}</h1>
      {confirm.isSuccess ? (
        <NoticeCard icon={<CheckIcon strokeWidth={3} />} tone="success" title={t('confirmEmail.doneTitle')}>
          <p className="text-muted-foreground">{t('confirmEmail.done', { email: confirm.data.email })}</p>
          <Link
            to="/organisation/portal"
            className={buttonVariants({ variant: 'outline', size: 'lg', className: 'mt-2 w-full' })}
          >
            {t('confirmEmail.continue')}
          </Link>
        </NoticeCard>
      ) : confirm.isError || token === '' ? (
        <StatusMessage tone="danger">{t('confirmEmail.invalid')}</StatusMessage>
      ) : (
        <Card>
          <Button
            type="button"
            variant="brand"
            size="lg"
            className="w-full"
            disabled={confirm.isPending}
            onClick={() => confirm.mutate(token)}
          >
            {t('confirmEmail.confirm')}
          </Button>
        </Card>
      )}
    </PortalColumn>
  );
}
