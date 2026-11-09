import { CircleAlertIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useTurnusOptionLabel } from '@/core/selected-turnus';
import { NewRegistrationPrice } from '@/features/participants/components/create/new-registration-price';
import type { useCreateRegistrationPage } from '@/features/participants/components/create/use-create-registration-page.hook';

interface CreateSummaryProps {
  page: ReturnType<typeof useCreateRegistrationPage>;
}

// The side of the form: which Turnus, the price as it will be stored with the Deposit first or not and a
// Discount code, a Deposit paid in cash, whether to email the guardians, and saving.
export function CreateSummary({ page }: CreateSummaryProps) {
  const { t } = useTranslation('participants');
  const optionLabel = useTurnusOptionLabel();
  const turnusId = useId();
  const codeId = useId();
  const noteId = useId();
  const cashHintId = useId();

  return (
    <aside className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-6 lg:col-span-2">
      <h2 className="text-heading">{t('create.summary')}</h2>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={turnusId} className="text-sm font-semibold">
          {t('turnus')}
        </label>
        <Select
          id={turnusId}
          value={page.chosen ?? null}
          onValueChange={page.setTurnusId}
          options={page.turnusy.map((turnus) => ({ value: turnus.id, label: optionLabel(turnus) }))}
        />
      </div>
      {page.hasNoForm ? (
        <Alert variant="warning">
          <CircleAlertIcon aria-hidden="true" />
          {t('create.noForm')}
        </Alert>
      ) : null}
      {page.price === undefined ? null : <NewRegistrationPrice price={page.price} isStale={page.isPriceStale} />}
      {page.isPriceFailing ? (
        <Alert variant="warning" role="alert">
          <CircleAlertIcon aria-hidden="true" />
          {t('create.priceFailed')}
        </Alert>
      ) : null}
      {page.depositAvailable ? (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <Checkbox className="mt-0.5" checked={page.depositFirst} onCheckedChange={page.setDepositFirst} />
          <span className="font-semibold">{t('create.depositFirst')}</span>
        </label>
      ) : null}
      {page.canPayCash ? (
        <div className="flex flex-col gap-1">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={page.cashDeposit}
              onCheckedChange={page.setCashDeposit}
              aria-describedby={cashHintId}
            />
            <span className="font-semibold">{t('create.cashDeposit')}</span>
          </label>
          <p id={cashHintId} className="-mt-2 pl-8 text-[13px] text-muted-foreground">
            {t('create.cashDepositHint')}
          </p>
        </div>
      ) : null}
      <Field>
        <FieldLabel htmlFor={codeId}>{t('create.discountCode')}</FieldLabel>
        <Input
          id={codeId}
          value={page.codeInput}
          onChange={(event) => page.setCodeInput(event.target.value)}
          onBlur={page.applyCode}
        />
      </Field>
      {page.codeCheck === null ? null : (
        <output className="block rounded-[14px] bg-muted px-3 py-2.5 text-sm font-medium">
          {t(`create.codeChecks.${page.codeCheck}`)}
        </output>
      )}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
        <Checkbox className="mt-0.5" checked={page.sendConfirmation} onCheckedChange={page.setSendConfirmation} />
        <span className="font-semibold">{t('create.sendConfirmation')}</span>
      </label>
      {page.failed ? (
        <Alert variant="danger" role="alert">
          <CircleAlertIcon aria-hidden="true" />
          {t('create.failed')}
        </Alert>
      ) : null}
      <Button type="button" size="lg" disabled={!page.canSubmit} onClick={page.submit} aria-describedby={noteId}>
        {t('create.submit')}
      </Button>
      <p id={noteId} className="text-[13px] text-muted-foreground">
        {t('create.submitNote')}
      </p>
    </aside>
  );
}
