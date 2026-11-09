import { useTranslation } from 'react-i18next';

import {
  AUDIT_ACTIONS,
  auditChangesOf,
  auditFieldOf,
  auditSubjectOf,
  isAuditAction,
  isAuditTargetType,
  type AuditEntry,
  type AuditTexts,
} from '@repo/schema/audit';

import { personName, personNameWithEmail } from '@/core/account';

// An entry as either view has it; the Registration history leaves the IP address out.
export type ShownAuditEntry = Omit<AuditEntry, 'ipAddress'> & { ipAddress?: AuditEntry['ipAddress'] };

/**
 * Read an audit entry as a sentence about a named record, by whom, with what changed in Czech; the action
 * key, ids, IP address and whatever has no Czech name go to its details.
 * @param entry the entry
 */
export function useAuditEntry(entry: ShownAuditEntry) {
  const { t } = useTranslation('audit');
  const { t: tCommon } = useTranslation();
  const action = isAuditAction(entry.action) ? entry.action : null;
  const subject = action === null ? null : auditSubjectOf(action);
  const texts: AuditTexts = {
    field: (label) => t(`fields.${label}`),
    value: (set, value) => t(`values.${set}.${value}`, { defaultValue: value }),
    yesNo: (value) => t(value ? 'yes' : 'no'),
  };
  const { rows, untranslated } = auditChangesOf(entry.action, entry.changes, texts);
  // A form field by the label the API gave it, any other encrypted field by the field's Czech name.
  const encrypted = entry.encryptedFields.map(({ field, label, labelKey }) => {
    const named = subject === null ? undefined : auditFieldOf(subject, field);

    return {
      field,
      name:
        label ??
        (labelKey === null
          ? named === undefined
            ? null
            : texts.field(named.label)
          : tCommon(labelKey, { defaultValue: field })),
    };
  });
  const kind = t(`actors.${entry.actor.kind}`);
  const { email, firstName, lastName } = entry.actor;
  const actor = email === null ? null : { email, firstName, lastName };
  const actorName = actor === null ? null : personName(actor);
  const type = isAuditTargetType(entry.target.type) ? t(`targets.${entry.target.type}`) : entry.target.type;

  return {
    action: action === null ? t('unknownAction') : t(`actions.${action}`),
    // Where the Owner filters for it; null for an action the catalogue no longer knows.
    area: action === null ? null : AUDIT_ACTIONS[action].area,
    // With the email, which is unique, since anyone invited may give themselves an Owner's name.
    actor: actor === null ? kind : t('actorWithName', { name: personNameWithEmail(actor), kind }),
    // Who did it, for their initials: by name, else by their kind.
    actorName: actorName ?? kind,
    target: {
      name:
        entry.target.state === 'erased'
          ? t('erased')
          : entry.target.state === 'removed'
            ? t('removed', { type })
            : entry.target.label === null || entry.target.variableSymbol === null
              ? entry.target.label
              : t('labelWithVariableSymbol', {
                  label: entry.target.label,
                  variableSymbol: entry.target.variableSymbol,
                }),
      link: entry.target.link,
    },
    changes: rows.map(({ field, label, old, new: current }) => ({
      field,
      text: t('fieldValue', {
        label,
        value: old === undefined ? (current ?? '') : current === undefined ? old : t('change', { old, new: current }),
      }),
    })),
    encrypted: encrypted.flatMap(({ name }) => (name === null ? [] : [name])),
    details: [
      { label: t('actionKey'), value: entry.action },
      { label: t('targetId'), value: `${entry.target.type} ${entry.target.id}` },
      ...(entry.ipAddress === undefined || entry.ipAddress === null
        ? []
        : [{ label: t('ipAddress'), value: entry.ipAddress }]),
      ...Object.entries(untranslated).map(([field, change]) => ({
        label: field,
        value: t('change', { old: JSON.stringify(change.old), new: JSON.stringify(change.new) }),
      })),
      ...encrypted.flatMap(({ field, name }) => (name === null ? [{ label: field, value: t('encryptedValue') }] : [])),
    ].map(({ label, value }) => ({ label, text: t('fieldValue', { label, value }) })),
  };
}
