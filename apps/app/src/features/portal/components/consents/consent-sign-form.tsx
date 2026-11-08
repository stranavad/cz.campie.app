import { FileTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianConsentParams } from '@repo/schema/consents';

import { Button, buttonVariants } from '@/components/ui/button';
import { ConsentItem } from '@/features/portal/components/consents/consent-item';
import { ConsentSignature } from '@/features/portal/components/consents/consent-signature';
import { SignerFields } from '@/features/portal/components/consents/signer-fields';
import { useConsentSignForm } from '@/features/portal/components/consents/use-consent-sign-form.hook';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

// A Consent in full for one child, to read and sign by typed name and place.
export function ConsentSignForm({ params }: { params: GuardianConsentParams }) {
  const { t } = useTranslation('portal');
  const form = useConsentSignForm(params);

  if (form.consent.data === undefined) {
    return form.consent.isError ? <StatusMessage tone="danger">{t('consents.loadFailed')}</StatusMessage> : null;
  }

  const { version, signature, withdrawable } = form.consent.data;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.submit(version.id);
      }}
    >
      <div className="flex flex-col gap-2 rounded-2xl bg-muted px-4 py-3.5 text-sm">
        <h3 className="font-bold">{version.title}</h3>
        {version.introduction === '' ? null : <p className="whitespace-pre-line">{version.introduction}</p>}
      </div>
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
      <ol className="flex flex-col">
        {version.items.map((item, index) => (
          <ConsentItem
            key={item.id}
            item={item}
            number={index + 1}
            answer={form.answers[item.id]}
            problem={form.problemAt(item.id)}
            onAnswer={(value) => form.answer(item.id, value)}
          />
        ))}
      </ol>
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
