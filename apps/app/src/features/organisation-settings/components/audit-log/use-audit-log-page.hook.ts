import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AUDIT_ACTOR_KINDS, AUDIT_AREAS } from '@repo/schema/audit';
import type { AuditLogQuery } from '@repo/schema/organisations';
import { addDays, czechDate, pragueDateOf } from '@repo/schema/shared';

import { useCurrentMembership } from '@/core/account';
import { useAuditLogQuery } from '@/features/organisation-settings/api/organisation-settings.queries';
import { groupByDay } from '@/features/organisation-settings/components/audit-log/group-by-day.helper';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value.hook';

export function useAuditLogPage() {
  const { t } = useTranslation('organisationSettings');
  const { membership, isLoading, isSignedOut } = useCurrentMembership();
  const [actorKind, setActorKind] = useState('');
  const [actor, setActor] = useState('');
  const [area, setArea] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [today] = useState(() => pragueDateOf(new Date()));
  const settledActor = useDebouncedValue(actor.trim(), 400);
  const isOwner = membership?.owner === true;
  const knownKind = AUDIT_ACTOR_KINDS.find((kind) => kind === actorKind);
  const knownArea = AUDIT_AREAS.find((known) => known === area);
  const query: Omit<AuditLogQuery, 'after'> = {
    ...(knownKind === undefined ? {} : { actorKind: knownKind }),
    ...(settledActor === '' ? {} : { actor: settledActor }),
    ...(knownArea === undefined ? {} : { area: knownArea }),
    ...(from === '' ? {} : { from: new Date(`${from}T00:00:00`).toISOString() }),
    ...(to === '' ? {} : { to: new Date(`${to}T23:59:59`).toISOString() }),
  };
  const log = useAuditLogQuery(membership?.organisation.id ?? '', query, isOwner);
  const entries = log.data?.pages.flatMap((page) => page.entries) ?? [];

  // "Dnes" and "Včera" read faster than dates for the days an Owner checks most.
  const dayLabel = (date: string) =>
    date === today ? t('auditLog.today') : date === addDays(today, -1) ? t('auditLog.yesterday') : czechDate(date);

  return {
    isSignedOut,
    isLoading,
    isOwner,
    filters: { actorKind, setActorKind, actor, setActor, area, setArea, from, setFrom, to, setTo },
    days: groupByDay(entries).map((day) => ({ ...day, label: dayLabel(day.date) })),
    isPending: log.isPending,
    isError: log.isError,
    isEmpty: log.data !== undefined && entries.length === 0,
    hasMore: log.hasNextPage,
    isFetchingMore: log.isFetchingNextPage,
    loadMore: () => void log.fetchNextPage(),
  };
}

export type AuditLogFilters = ReturnType<typeof useAuditLogPage>['filters'];
