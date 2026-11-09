import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { AUDIT_ACTOR_KINDS, AUDIT_AREAS } from '@repo/schema/audit';

import { DatePicker } from '@/components/date-picker/date-picker';
import { FilterPill } from '@/components/filter-pill';
import { SearchInput } from '@/components/search-input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { AUDIT_LOG_PERIODS } from '@/features/organisation-settings/components/audit-log/audit-log-period.constant';
import type { AuditLogFilters as Filters } from '@/features/organisation-settings/components/audit-log/use-audit-log-page.hook';

interface AuditLogFiltersProps {
  filters: Filters;
}

// A search by email and pills for who, the area and the period; a custom period opens its two dates.
export function AuditLogFilters({ filters }: AuditLogFiltersProps) {
  const { t } = useTranslation('organisationSettings');
  const { t: tAudit } = useTranslation('audit');
  const id = useId();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="flex-[1_1_16rem]"
          aria-label={t('auditLog.search')}
          placeholder={t('auditLog.searchPlaceholder')}
          value={filters.actor}
          onChange={(event) => filters.setActor(event.target.value)}
        />
        <FilterPill
          label={t('auditLog.actorKind')}
          value={filters.actorKind}
          onValueChange={filters.setActorKind}
          options={[
            { value: '', label: t('auditLog.anyone') },
            ...AUDIT_ACTOR_KINDS.map((kind) => ({ value: kind, label: tAudit(`actors.${kind}`) })),
          ]}
        />
        <FilterPill
          label={t('auditLog.area')}
          value={filters.area}
          onValueChange={filters.setArea}
          options={[
            { value: '', label: t('auditLog.anyArea') },
            ...AUDIT_AREAS.map((area) => ({ value: area, label: tAudit(`areas.${area}`) })),
          ]}
        />
        <Select
          variant="pill"
          aria-label={t('auditLog.period')}
          value={filters.period}
          onValueChange={filters.setPeriod}
          options={AUDIT_LOG_PERIODS.map((period) => ({ value: period, label: t(`auditLog.periods.${period}`) }))}
        />
      </div>
      {filters.period === 'custom' ? (
        <div className="grid max-w-lg grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor={`${id}-from`}>{t('auditLog.from')}</FieldLabel>
            <DatePicker id={`${id}-from`} value={filters.from} onChange={filters.setFrom} clearable />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-to`}>{t('auditLog.to')}</FieldLabel>
            <DatePicker id={`${id}-to`} value={filters.to} onChange={filters.setTo} clearable />
          </Field>
        </div>
      ) : null}
    </div>
  );
}
