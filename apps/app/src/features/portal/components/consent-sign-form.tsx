import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CONSENT_ANSWER_ERROR_CODES, type GuardianConsentParams } from '@repo/schema/consents';
import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useGuardianConsentQuery,
  useSignConsentMutation,
  useWithdrawConsentMutation,
} from '@/features/portal/api/portal.queries';
import { HttpError } from '@/lib/api';
import { readErrorResponse } from '@/lib/api/error-response.helper';

// A Consent in full for one child, to read and sign by typed name and place.
export function ConsentSignForm({ params }: { params: GuardianConsentParams }) {
  const { t } = useTranslation('portal');
  const consent = useGuardianConsentQuery(params);
  const sign = useSignConsentMutation(params);
  const withdraw = useWithdrawConsentMutation(params);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [signerName, setSignerName] = useState('');
  const [signerPlace, setSignerPlace] = useState('');
  const refusal = sign.error instanceof HttpError ? readErrorResponse(sign.error.details) : null;
  const problemAt = (itemId: string) => {
    const code = refusal?.fields?.find(({ path }) => path[1] === itemId)?.code;

    return CONSENT_ANSWER_ERROR_CODES.find((known) => known === code);
  };

  if (consent.data === undefined) {
    return consent.isError ? <p className="text-sm text-destructive">{t('consents.loadFailed')}</p> : null;
  }

  const { version, signature, withdrawable } = consent.data;
  const answer = (itemId: string, value: boolean) => {
    sign.reset();
    setAnswers({ ...answers, [itemId]: value });
  };

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border p-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        sign.mutate({ consentVersionId: version.id, answers, signerName, signerPlace });
      }}
    >
      <h3 className="text-base font-semibold">{version.title}</h3>
      {version.introduction === '' ? null : <p className="whitespace-pre-line">{version.introduction}</p>}
      {version.file === null ? null : (
        <a href={version.file.link.url} target="_blank" rel="noreferrer" className="self-start underline">
          {t('consents.readPdf')}
        </a>
      )}
      <ol className="flex list-decimal flex-col gap-3 pl-5">
        {version.items.map((item) => {
          const problem = problemAt(item.id);

          return (
            <li key={item.id} className="flex flex-col gap-1">
              <p className="whitespace-pre-line">{item.text}</p>
              {item.kind === 'must_agree' ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={answers[item.id] === true}
                    onChange={(event) => answer(item.id, event.target.checked)}
                  />
                  {t('consents.agree')}
                </label>
              ) : null}
              {item.kind === 'yes_no' ? (
                <span className="flex gap-4">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={item.id}
                      checked={answers[item.id] === true}
                      onChange={() => answer(item.id, true)}
                    />
                    {t('consents.yes')}
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={item.id}
                      checked={answers[item.id] === false}
                      onChange={() => answer(item.id, false)}
                    />
                    {t('consents.no')}
                  </label>
                </span>
              ) : null}
              {problem === undefined ? null : <p className="text-destructive">{t(`consents.problems.${problem}`)}</p>}
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground">
        {version.withdrawable ? t('consents.withdrawable') : t('consents.binding')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1">
          {t('consents.signerName')}
          <Input value={signerName} onChange={(event) => setSignerName(event.target.value)} autoComplete="name" />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          {t('consents.signerPlace')}
          <Input value={signerPlace} onChange={(event) => setSignerPlace(event.target.value)} />
        </label>
      </div>
      <p className="text-muted-foreground">{t('consents.signNote')}</p>
      {sign.isError ? (
        <p role="alert" className="text-destructive">
          {refusal?.code === 'consent_version_outdated'
            ? t('consents.outdated')
            : refusal?.code === 'consent_answers_invalid'
              ? t('consents.answersInvalid')
              : t('consents.signFailed')}
        </p>
      ) : null}
      {signature === null ? null : (
        <p className="flex flex-wrap gap-x-2">
          {t('consents.signedAt', { name: signature.signerName, date: czechDateTime(signature.signedAt) })}
          {signature.withdrawnAt === null ? null : (
            <span className="font-medium">
              {t('consents.withdrawnAt', { date: czechDateTime(signature.withdrawnAt) })}
            </span>
          )}
          {signature.signedPdf === null ? null : (
            <a href={signature.signedPdf.url} target="_blank" rel="noreferrer" className="underline">
              {t('consents.signedPdf')}
            </a>
          )}
        </p>
      )}
      {withdrawable ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={withdraw.isPending}
            onClick={() => (confirmWithdraw ? withdraw.mutate() : setConfirmWithdraw(true))}
          >
            {confirmWithdraw ? t('consents.withdrawConfirm') : t('consents.withdraw')}
          </Button>
          {withdraw.isError ? <span className="text-destructive">{t('consents.withdrawFailed')}</span> : null}
        </div>
      ) : null}
      <Button
        type="submit"
        className="self-start"
        disabled={sign.isPending || signerName.trim().length < 3 || signerPlace.trim().length < 2}
      >
        {signature === null ? t('consents.sign') : t('consents.signAgain')}
      </Button>
    </form>
  );
}
