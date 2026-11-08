import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { AUDIT_ACTOR_KINDS, AUDIT_AREAS } from '@repo/schema/audit';

import { DatePicker } from '@/components/date-picker/date-picker';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { AuditLogFilters as Filters } from '@/features/organisation-settings/components/audit-log/use-audit-log-page.hook';

interface AuditLogFiltersProps {
  filters: Filters;
}

// Who, what and when: stacked on a phone, one row on a laptop.
export function AuditLogFilters({ filters }: AuditLogFiltersProps) {
  const { t } = useTranslation('organisationSettings');
  const { t: tAudit } = useTranslation('audit');
  const id = useId();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Field>
        <FieldLabel htmlFor={`${id}-kind`}>{t('auditLog.actorKind')}</FieldLabel>
        <Select
          id={`${id}-kind`}
          value={filters.actorKind}
          onValueChange={filters.setActorKind}
          options={[
            { value: '', label: t('auditLog.anyone') },
            ...AUDIT_ACTOR_KINDS.map((kind) => ({ value: kind, label: tAudit(`actors.${kind}`) })),
          ]}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-actor`}>{t('auditLog.actor')}</FieldLabel>
        <Input
          id={`${id}-actor`}
          type="search"
          value={filters.actor}
          onChange={(event) => filters.setActor(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-area`}>{t('auditLog.area')}</FieldLabel>
        <Select
          id={`${id}-area`}
          value={filters.area}
          onValueChange={filters.setArea}
          options={[
            { value: '', label: t('auditLog.anyArea') },
            ...AUDIT_AREAS.map((area) => ({ value: area, label: tAudit(`areas.${area}`) })),
          ]}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
        <Field>
          <FieldLabel htmlFor={`${id}-from`}>{t('auditLog.from')}</FieldLabel>
          <DatePicker id={`${id}-from`} value={filters.from} onChange={filters.setFrom} clearable />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-to`}>{t('auditLog.to')}</FieldLabel>
          <DatePicker id={`${id}-to`} value={filters.to} onChange={filters.setTo} clearable />
        </Field>
      </div>
    </div>
  );
}
