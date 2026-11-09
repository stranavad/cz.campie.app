import { FileTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianConsentParams } from '@repo/schema/consents';

import { Button, buttonVariants } from '@/components/ui/button';
import { ConsentItem } from '@/features/portal/components/consents/consent-item';
import { ConsentSignature } from '@/features/portal/components/consents/consent-signature';
import { ConsentText } from '@/features/portal/components/consents/consent-text';
import { SignerFields } from '@/features/portal/components/consents/signer-fields';
import { useConsentSignForm } from '@/features/portal/components/consents/use-consent-sign-form.hook';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

interface ConsentSignFormProps {
  params: GuardianConsentParams;
}

// A Consent in full for one child, to read and sign by typed name and place.
export function ConsentSignForm({ params }: ConsentSignFormProps) {
  const { t } = useTranslation('portal');
  const form = useConsentSignForm(params);

  if (form.consent.data === undefined) {
    return form.consent.isError ? <StatusMessage tone="danger">{t('consents.loadFailed')}</StatusMessage> : null;
  }

  const { version, signature, withdrawable } = form.consent.data;

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        form.submit(version.id);
      }}
    >
      {version.introduction === '' ? null : <ConsentText text={version.introduction} />}
      {version.file === null ? null : (
        <a
          href={version.file.link.url}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'self-start' })}
        >
          <FileTextIcon aria-hidden="true" />
          {t('consents.readPdf')}
        </a>
      )}
      <ul className="flex flex-col">
        {version.items.map((item) => (
          <ConsentItem
            key={item.id}
            item={item}
            answer={form.answers[item.id]}
            problem={form.problemAt(item.id)}
            onAnswer={(value) => form.answer(item.id, value)}
          />
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        {version.withdrawable ? t('consents.withdrawable') : t('consents.binding')}
      </p>
      <SignerFields
        name={form.signerName}
        place={form.signerPlace}
        onName={form.setSignerName}
        onPlace={form.setSignerPlace}
      />
      <p className="text-[13px] text-muted-foreground">{t('consents.signNote')}</p>
      {form.signFailure === null ? null : (
        <StatusMessage tone="danger">{t(`consents.${form.signFailure}`)}</StatusMessage>
      )}
      {signature === null ? null : <ConsentSignature signature={signature} />}
      {withdrawable ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={form.confirmWithdraw ? 'destructive' : 'outline'}
            className="self-start"
            disabled={form.isWithdrawing}
            onClick={form.withdraw}
          >
            {form.confirmWithdraw ? t('consents.withdrawConfirm') : t('consents.withdraw')}
          </Button>
          {form.withdrawFailed ? <StatusMessage tone="danger">{t('consents.withdrawFailed')}</StatusMessage> : null}
        </div>
      ) : null}
      <Button type="submit" variant="brand" size="lg" className="w-full" disabled={!form.canSubmit}>
        {signature === null ? t('consents.sign') : t('consents.signAgain')}
      </Button>
    </form>
  );
}
