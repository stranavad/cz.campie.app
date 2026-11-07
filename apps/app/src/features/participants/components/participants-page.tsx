import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PAYMENT_STATUSES } from '@repo/schema/pricing';
import { czechDate, czk } from '@repo/schema/shared';

import { Input } from '@/components/ui/input';
import { useParticipantsPage } from '@/features/participants/components/use-participants-page.hook';

// The admin's working list: the Participants of the Selected Turnus, searched and filtered.
export function ParticipantsPage() {
  const { t } = useTranslation('participants');
  const page = useParticipantsPage();

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (page.hasNoAccess) {
    return <p className="py-12">{t('noAccess')}</p>;
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-3">
        <Link to="/platform" className="text-sm text-muted-foreground underline">
          {t('backHome')}
        </Link>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {page.turnusy.length === 0 ? <p>{t('noTurnusy')}</p> : null}
        <label className="flex flex-col gap-1 text-sm font-medium sm:max-w-md">
          {t('turnus')}
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2"
            value={page.turnusId ?? ''}
            onChange={(event) => page.selectTurnus(event.target.value)}
          >
            {page.turnusy.map((turnus) => (
              <option key={turnus.id} value={turnus.id}>
                {t('turnusOption', { camp: turnus.campName, turnus: turnus.name, date: czechDate(turnus.startDate) })}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          {t('search')}
          <Input type="search" value={page.search} onChange={(event) => page.setSearch(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('paymentStatus')}
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2"
            value={page.paymentStatus}
            onChange={(event) => page.setPaymentStatus(event.target.value)}
          >
            <option value="">{t('anyStatus')}</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={page.unverified}
            onChange={(event) => page.setUnverified(event.target.checked)}
          />
          {t('unverified')}
        </label>
      </div>
      {page.isError ? <p className="text-destructive">{t('error')}</p> : null}
      {page.isEmpty ? <p className="text-muted-foreground">{t('empty')}</p> : null}
      <ul className="flex flex-col divide-y rounded-lg border" aria-busy={page.isStale}>
        {page.rows.map((row) => (
          <li key={row.participantId} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              to="/platform/prihlasky/$registrationId"
              params={{ registrationId: row.registrationId }}
              className={`font-medium underline sm:w-48 ${row.status === 'cancelled' ? 'line-through' : ''}`}
            >
              {t('name', { first: row.firstName, last: row.lastName })}
            </Link>
            <span className="text-sm text-muted-foreground sm:w-16">{t('age', { count: row.ageOnStart })}</span>
            <span className="text-sm sm:flex-1">
              {t('guardian', { name: row.guardianName, email: row.guardianEmail })}
            </span>
            <span className="text-sm tabular-nums sm:w-24">{row.variableSymbol}</span>
            <span className={`text-sm sm:w-40 ${row.overdue ? 'text-destructive' : ''}`}>
              {row.amountDue.amount === 0
                ? t(`status.${row.paymentStatus}`)
                : t('due', { amount: czk(row.amountDue.amount), status: t(`status.${row.paymentStatus}`) })}
            </span>
            {row.status === 'cancelled' ? <span className="text-sm">{t('cancelled')}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
