// Where the Owner looks for an action in the audit log: each is one choice of its area filter.
export const AUDIT_AREAS = [
  'camps',
  'turnusy',
  'registrations',
  'payments',
  'consents',
  'documents',
  'emails',
  'exports',
  'members',
  'organisation',
] as const;

export type AuditArea = (typeof AUDIT_AREAS)[number];

interface AuditActionEntry {
  readonly area: AuditArea;
  // The kinds of record an entry of the action is about; most actions have one.
  readonly targets: readonly string[];
}

// Every action an Organisation's audit log records, as '<subject>.<verb>', with its area and the kinds of
// record its entries target. The API records only these, and the app names each one, so a missing
// translation fails type checking. The subject is what the action changes, which may live on another record:
// a guardian's change targets its Registration, a Consent signed its Participant.
export const AUDIT_ACTIONS = {
  'admin.create': { area: 'members', targets: ['admin'] },
  'admin.replace_credentials': { area: 'members', targets: ['admin'] },
  'admin.verify_email': { area: 'members', targets: ['admin'] },
  'camp.create': { area: 'camps', targets: ['camp'] },
  'camp.update': { area: 'camps', targets: ['camp'] },
  'camp_description.update': { area: 'camps', targets: ['camp'] },
  'camp_email_text.remove': { area: 'camps', targets: ['camp_email_text'] },
  'camp_email_text.update': { area: 'camps', targets: ['camp_email_text'] },
  'camp_photo.remove': { area: 'camps', targets: ['camp'] },
  'camp_photo.update': { area: 'camps', targets: ['camp'] },
  'claimed_discount.verify': { area: 'payments', targets: ['participant'] },
  'consent.create': { area: 'consents', targets: ['consent'] },
  'consent.publish': { area: 'consents', targets: ['consent'] },
  'consent.sign': { area: 'consents', targets: ['participant'] },
  'consent.withdraw': { area: 'consents', targets: ['participant'] },
  'consent_file.create': { area: 'consents', targets: ['consent_file'] },
  'consent_signature.download': { area: 'consents', targets: ['consent_signature'] },
  'discount_code.create': { area: 'camps', targets: ['discount_code'] },
  'discount_code.remove': { area: 'camps', targets: ['discount_code'] },
  'discount_code.update': { area: 'camps', targets: ['discount_code'] },
  'document_type.create': { area: 'documents', targets: ['document_type'] },
  'document_type.remove': { area: 'documents', targets: ['document_type'] },
  'document_type.update': { area: 'documents', targets: ['document_type'] },
  'document_upload.approve': { area: 'documents', targets: ['participant'] },
  'document_upload.create': { area: 'documents', targets: ['participant'] },
  'document_upload.paper': { area: 'documents', targets: ['participant'] },
  'document_upload.replace': { area: 'documents', targets: ['participant'] },
  'document_upload.return': { area: 'documents', targets: ['participant'] },
  'export.create': { area: 'exports', targets: ['organisation', 'turnus'] },
  'export_preset.create': { area: 'exports', targets: ['camp'] },
  'export_preset.remove': { area: 'exports', targets: ['camp'] },
  'guardian_login_link.use': { area: 'registrations', targets: ['guardian_login_link'] },
  'health_answers.view': { area: 'registrations', targets: ['registration'] },
  'internal_document.create': { area: 'documents', targets: ['participant'] },
  'internal_document.remove': { area: 'documents', targets: ['participant'] },
  'internal_document.view': { area: 'documents', targets: ['participant'] },
  'invoice_file.create': { area: 'payments', targets: ['registration'] },
  'invoice_request.create': { area: 'payments', targets: ['registration'] },
  'invoice_request.remove': { area: 'payments', targets: ['registration'] },
  'invoice_request.update': { area: 'payments', targets: ['registration'] },
  'invitation.accept': { area: 'members', targets: ['invitation'] },
  'invitation.create': { area: 'members', targets: ['invitation'] },
  'invitation.remove': { area: 'members', targets: ['invitation'] },
  'invitation.update': { area: 'members', targets: ['invitation'] },
  'legal_acceptance.create': { area: 'organisation', targets: ['legal_acceptance'] },
  'member.reset_totp': { area: 'members', targets: ['membership'] },
  'membership.create': { area: 'members', targets: ['membership'] },
  'membership.remove': { area: 'members', targets: ['membership'] },
  'membership.update': { area: 'members', targets: ['membership'] },
  'open_items_reminder.send': { area: 'registrations', targets: ['turnus'] },
  'organisation.create': { area: 'organisation', targets: ['organisation'] },
  'organisation.update': { area: 'organisation', targets: ['organisation'] },
  'participant.cancel': { area: 'registrations', targets: ['participant'] },
  'participant.create': { area: 'registrations', targets: ['participant'] },
  'participant.generate_prihlaska': { area: 'registrations', targets: ['participant'] },
  'participant.request_prihlaska': { area: 'registrations', targets: ['participant'] },
  'payment.create': { area: 'payments', targets: ['registration'] },
  'payment_gateway.remove': { area: 'organisation', targets: ['organisation'] },
  'payment_gateway.update': { area: 'organisation', targets: ['organisation'] },
  'payment_reminder.send': { area: 'payments', targets: ['turnus'] },
  'price_adjustment.create': { area: 'payments', targets: ['registration'] },
  'registration.answer': { area: 'registrations', targets: ['registration'] },
  'registration.create': { area: 'registrations', targets: ['registration'] },
  'registration.edit': { area: 'registrations', targets: ['registration'] },
  'registration.erase': { area: 'registrations', targets: ['registration'] },
  'registration.move': { area: 'registrations', targets: ['registration'] },
  'registration.submit': { area: 'registrations', targets: ['registration'] },
  'registration_access_email.create': { area: 'registrations', targets: ['registration'] },
  'registration_access_email.remove': { area: 'registrations', targets: ['registration'] },
  'registration_form.update': { area: 'camps', targets: ['registration_form'] },
  'registration_form_file.create': { area: 'camps', targets: ['registration_form_file'] },
  'registration_form_file.remove': { area: 'camps', targets: ['registration_form_file'] },
  'registration_form_version.create': { area: 'camps', targets: ['registration_form_version'] },
  'registration_guardian.create': { area: 'registrations', targets: ['registration'] },
  'registration_guardian.remove': { area: 'registrations', targets: ['registration'] },
  'registration_guardian.request_email_change': { area: 'registrations', targets: ['registration'] },
  'registration_guardian.update': { area: 'registrations', targets: ['registration'] },
  'support_access.enter': { area: 'organisation', targets: ['organisation'] },
  'support_access.grant': { area: 'organisation', targets: ['organisation'] },
  'support_access.leave': { area: 'organisation', targets: ['organisation'] },
  'support_access.revoke': { area: 'organisation', targets: ['organisation'] },
  'turnus.create': { area: 'turnusy', targets: ['turnus'] },
  'turnus.remove': { area: 'turnusy', targets: ['turnus'] },
  'turnus.update': { area: 'turnusy', targets: ['turnus'] },
  'undeliverable_email.clear': { area: 'emails', targets: ['undeliverable_email'] },
  'undeliverable_email.mark': { area: 'emails', targets: ['undeliverable_email'] },
} as const satisfies Record<`${string}.${string}`, AuditActionEntry>;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

// The kinds of record an action may target.
export type AuditTargetType = (typeof AUDIT_ACTIONS)[AuditAction]['targets'][number];

// The kind of record an action may target, for one action.
export type AuditTargetOf<A extends AuditAction> = (typeof AUDIT_ACTIONS)[A]['targets'][number];

// What an action changes: the part of its name before the verb.
export type AuditSubject = SubjectOf<AuditAction>;

type SubjectOf<A extends string> = A extends `${infer Subject}.${string}` ? Subject : never;

/**
 * Tell what an action changes: the part of its name before the verb.
 * @param action the action
 */
export function auditSubjectOf(action: AuditAction): AuditSubject {
  // Every action of the catalogue is '<subject>.<verb>', so this is one of its subjects.
  return action.slice(0, action.indexOf('.')) as AuditSubject;
}

/**
 * Tell whether a recorded action is one the catalogue knows; an entry may predate a renamed one.
 * @param action the entry's action
 */
export function isAuditAction(action: string): action is AuditAction {
  return Object.hasOwn(AUDIT_ACTIONS, action);
}

/**
 * List the actions of an area, for filtering the audit log by it.
 * @param area the area
 */
export function auditActionsIn(area: AuditArea): AuditAction[] {
  return Object.entries(AUDIT_ACTIONS).flatMap(([action, entry]) =>
    entry.area === area && isAuditAction(action) ? [action] : [],
  );
}

/**
 * Tell whether a recorded target type is one the catalogue's actions target.
 * @param type the entry's target type
 */
export function isAuditTargetType(type: string): type is AuditTargetType {
  return Object.values(AUDIT_ACTIONS).some(({ targets }) => targets.some((target) => target === type));
}
