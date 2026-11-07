import { Link, Navigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AUDIT_ACTOR_KINDS, type AuditLogQuery } from '@repo/schema/organisations';
import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentMembership } from '@/core/account';
import { useAuditLogQuery } from '@/features/organisation-settings/api/organisation-settings.queries';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value.hook';

const formatValue = (value: unknown) =>
  value === null || value === undefined ? '-' : typeof value === 'string' ? value : JSON.stringify(value);

// The Organisation's whole audit log for its Owners: who did what to which record, with old and new values.
export function AuditLogPage() {
  const { t } = useTranslation('organisationSettings');
  const { membership, isLoading, isSignedOut } = useCurrentMembership();
  const [actorKind, setActorKind] = useState('');
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const settledActor = useDebouncedValue(actor.trim(), 400);
  const settledAction = useDebouncedValue(action.trim(), 400);
  const isOwner = membership?.owner === true;
  const filters: Omit<AuditLogQuery, 'after'> = {
    ...(AUDIT_ACTOR_KINDS.find((kind) => kind === actorKind) === undefined
      ? {}
      : { actorKind: AUDIT_ACTOR_KINDS.find((kind) => kind === actorKind) }),
    ...(settledActor === '' ? {} : { actor: settledActor }),
    ...(settledAction === '' ? {} : { action: settledAction }),
    ...(from === '' ? {} : { from: new Date(`${from}T00:00:00`).toISOString() }),
    ...(to === '' ? {} : { to: new Date(`${to}T23:59:59`).toISOString() }),
  };
  const log = useAuditLogQuery(membership?.organisation.id ?? '', filters, isOwner);

  if (isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (isLoading) {
    return null;
  }

  if (!isOwner) {
    return <p className="py-12">{t('notOwner')}</p>;
  }

  const entries = log.data?.pages.flatMap(({ entries: page }) => page) ?? [];

  return (
    <div className="flex flex-col gap-6 py-8">
      <Link to="/platform" className="text-sm text-muted-foreground underline">
        {t('backHome')}
      </Link>
      <h1 className="text-2xl font-semibold">{t('auditLog.title')}</h1>
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          {t('auditLog.actorKind')}
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2"
            value={actorKind}
            onChange={(event) => setActorKind(event.target.value)}
          >
            <option value="">{t('auditLog.anyone')}</option>
            {AUDIT_ACTOR_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(`auditLog.kinds.${kind}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {t('auditLog.actor')}
          <Input value={actor} onChange={(event) => setActor(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          {t('auditLog.action')}
          <Input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder={t('auditLog.actionHint')}
          />
        </label>
        <label className="flex flex-col gap-1">
          {t('auditLog.from')}
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          {t('auditLog.to')}
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>
      {log.isError ? <p className="text-destructive">{t('auditLog.loadFailed')}</p> : null}
      <ul className="flex flex-col divide-y rounded-lg border text-sm">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-1 p-3">
            <div className="flex flex-wrap gap-3">
              <span className="tabular-nums text-muted-foreground">{czechDateTime(entry.occurredAt)}</span>
              <span className="font-medium">{entry.action}</span>
              <span>
                {t(`auditLog.kinds.${entry.actor.kind}`)}
                {entry.actor.name === null ? null : `: ${entry.actor.name}`}
              </span>
              <span className="text-muted-foreground">
                {entry.target.type} {entry.target.id}
              </span>
            </div>
            {entry.changes === null ? null : (
              <ul className="flex flex-col gap-0.5 text-muted-foreground">
                {Object.entries(entry.changes).map(([field, change]) => (
                  <li key={field} className="break-all">
                    {t('auditLog.change', { field, old: formatValue(change.old), new: formatValue(change.new) })}
                  </li>
                ))}
              </ul>
            )}
            {entry.encryptedFields.length === 0 ? null : (
              <span className="text-muted-foreground">
                {t('auditLog.encrypted', { fields: entry.encryptedFields.join(', ') })}
              </span>
            )}
          </li>
        ))}
        {log.data !== undefined && entries.length === 0 ? (
          <li className="p-3 text-muted-foreground">{t('auditLog.none')}</li>
        ) : null}
      </ul>
      {log.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={log.isFetchingNextPage}
          onClick={() => void log.fetchNextPage()}
        >
          {t('auditLog.more')}
        </Button>
      ) : null}
    </div>
  );
}
