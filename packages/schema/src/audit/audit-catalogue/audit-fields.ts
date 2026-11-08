import type { AuditSubject } from './audit-actions.ts';

// How a recorded value reads: as it is (text, email), Ano/Ne, Czech money, a Czech date or date and time, a
// translated value of a fixed set, or a list of items.
export const AUDIT_VALUE_KINDS = ['text', 'boolean', 'money', 'date', 'datetime', 'enum', 'list', 'email'] as const;

export type AuditValueKind = (typeof AUDIT_VALUE_KINDS)[number];

interface FieldSpec {
  // The field's name among the app's translations, `fields.<label>`.
  readonly label: string;
  readonly kind: AuditValueKind;
  // The fixed set an enum value, or each item of a list, is translated from, `values.<set>.<value>`.
  readonly values?: string;
}

const text = <L extends string>(label: L) => ({ label, kind: 'text' }) as const;
const email = <L extends string>(label: L) => ({ label, kind: 'email' }) as const;
const yesNo = <L extends string>(label: L) => ({ label, kind: 'boolean' }) as const;
const money = <L extends string>(label: L) => ({ label, kind: 'money' }) as const;
const date = <L extends string>(label: L) => ({ label, kind: 'date' }) as const;
const datetime = <L extends string>(label: L) => ({ label, kind: 'datetime' }) as const;
const oneOf = <L extends string, V extends string>(label: L, values: V) => ({ label, kind: 'enum', values }) as const;
const list = <L extends string>(label: L, values?: string) =>
  values === undefined ? ({ label, kind: 'list' } as const) : ({ label, kind: 'list', values } as const);

// The fields the audit log names, per subject, since a field such as `status` means different things on
// different records. A recorded field missing here is shown only among an entry's details.
export const AUDIT_FIELDS = {
  admin: { email: email('email') },
  camp: {
    name: text('name'),
    slug: text('slug'),
    websiteUrl: text('websiteUrl'),
    contactName: text('contactName'),
    contactEmail: email('contactEmail'),
    contactPhone: text('contactPhone'),
    modules: list('modules', 'campModule'),
    siblingDiscountAmount: money('siblingDiscountAmount'),
    siblingDiscountAppliesTo: oneOf('siblingDiscountAppliesTo', 'siblingDiscountMode'),
    notificationEmails: list('notificationEmails'),
    contactEditLockDate: date('contactEditLockDate'),
    accentColour: text('accentColour'),
  },
  camp_email_text: {
    type: oneOf('emailType', 'emailType'),
    subject: text('subject'),
    text: text('text'),
    enabled: yesNo('enabled'),
  },
  claimed_discount: { label: text('discountLabel'), amount: money('amount'), verifiedAt: datetime('verifiedAt') },
  consent: {
    title: text('title'),
    introduction: text('introduction'),
    version: text('version'),
    withdrawable: yesNo('withdrawable'),
    publishedAt: datetime('publishedAt'),
    signerName: text('signerName'),
    signerPlace: text('signerPlace'),
    signerEmail: email('signerEmail'),
    signedAt: datetime('signedAt'),
    withdrawnByEmail: email('withdrawnByEmail'),
    withdrawnAt: datetime('withdrawnAt'),
  },
  discount_code: {
    code: text('code'),
    kind: oneOf('discountKind', 'discountCodeKind'),
    value: text('discountValue'),
    usageLimit: text('usageLimit'),
    expiresOn: date('expiresOn'),
    active: yesNo('active'),
  },
  document_type: {
    kind: oneOf('documentKind', 'documentTypeKind'),
    name: text('name'),
    description: text('description'),
    dueDate: date('dueDate'),
  },
  document_upload: {
    status: oneOf('uploadStatus', 'uploadStatus'),
    note: text('note'),
    uploadedByEmail: email('uploadedByEmail'),
    uploadedAt: datetime('uploadedAt'),
  },
  internal_document: { uploadedAt: datetime('uploadedAt') },
  export: {
    kind: oneOf('exportKind', 'exportKind'),
    columns: list('columns'),
    sensitiveColumns: list('sensitiveColumns'),
    paidFrom: date('paidFrom'),
    paidTo: date('paidTo'),
  },
  export_preset: { name: text('name'), columns: list('columns') },
  invitation: { email: email('email'), expiresAt: datetime('expiresAt') },
  legal_acceptance: {
    document: oneOf('legalDocument', 'legalDocument'),
    version: text('version'),
    acceptedAt: datetime('acceptedAt'),
  },
  membership: { email: email('email'), owner: yesNo('owner'), totpEnabled: yesNo('totpEnabled') },
  open_items_reminder: { reminded: text('reminded') },
  organisation: {
    subdomain: text('subdomain'),
    status: oneOf('organisationStatus', 'organisationStatus'),
    legalName: text('legalName'),
    ico: text('ico'),
    address: text('address'),
    statutoryRepresentative: text('statutoryRepresentative'),
    vatId: text('vatId'),
    contactEmail: email('contactEmail'),
    contactPhone: text('contactPhone'),
    billingEmail: email('billingEmail'),
    bankAccount: text('bankAccount'),
    displayName: text('displayName'),
    accentColour: text('accentColour'),
    totpRequired: yesNo('totpRequired'),
  },
  participant: {
    status: oneOf('participantStatus', 'participantStatus'),
    firstName: text('firstName'),
    lastName: text('lastName'),
    birthDate: date('birthDate'),
  },
  payment: {
    source: oneOf('paymentSource', 'paymentSource'),
    amount: money('amount'),
    paidOn: date('paidOn'),
    note: text('note'),
    recordedAt: datetime('recordedAt'),
    gatewayTransactionId: text('gatewayTransactionId'),
  },
  payment_gateway: { merchantId: text('merchantId'), secret: text('secret') },
  payment_reminder: { overdueOnly: yesNo('overdueOnly'), reminded: text('reminded') },
  price_adjustment: { amount: money('amount'), note: text('note') },
  registration: {
    variableSymbol: text('variableSymbol'),
    turnus: text('turnus'),
    paymentChoice: oneOf('paymentChoice', 'paymentChoice'),
    depositTotal: money('depositTotal'),
    depositDueDate: date('depositDueDate'),
    balanceDueDate: date('balanceDueDate'),
    guardians: list('guardians'),
    participants: list('participants'),
    sendConfirmation: yesNo('sendConfirmation'),
    files: text('files'),
  },
  registration_access_email: { email: email('email') },
  registration_form: { maxParticipants: text('maxParticipants') },
  registration_form_version: { version: text('version'), maxParticipants: text('maxParticipants') },
  registration_guardian: {
    position: text('guardianPosition'),
    firstName: text('firstName'),
    lastName: text('lastName'),
    email: email('email'),
    phone: text('phone'),
  },
  support_access: {
    allowWrites: yesNo('allowWrites'),
    grantedAt: datetime('grantedAt'),
    expiresAt: datetime('expiresAt'),
    revokedAt: datetime('revokedAt'),
  },
  turnus: {
    name: text('name'),
    startDate: date('startDate'),
    endDate: date('endDate'),
    place: text('place'),
    capacity: text('capacity'),
    minAge: text('minAge'),
    maxAge: text('maxAge'),
    opensAt: datetime('opensAt'),
    closesAt: datetime('closesAt'),
    closedManually: yesNo('closedManually'),
    websiteUrl: text('websiteUrl'),
    basePrice: money('basePrice'),
    earlyBirdPrice: money('earlyBirdPrice'),
    earlyBirdLastDay: date('earlyBirdLastDay'),
    deposit: money('deposit'),
    depositDueDays: text('depositDueDays'),
    balanceDueDate: date('balanceDueDate'),
  },
  undeliverable_email: {
    email: email('email'),
    reason: oneOf('undeliverableReason', 'undeliverableReason'),
    markedAt: datetime('markedAt'),
  },
} as const satisfies Partial<Record<AuditSubject, Readonly<Record<string, FieldSpec>>>>;

type AuditFields = typeof AUDIT_FIELDS;

// Every field name the app must translate, `fields.<label>`.
export type AuditFieldLabel = {
  [S in keyof AuditFields]: AuditFields[S][keyof AuditFields[S]] extends { label: infer L } ? L : never;
}[keyof AuditFields];

// Every fixed set whose values the app translates, `values.<set>.<value>`.
export type AuditValueSet = {
  [S in keyof AuditFields]: AuditFields[S][keyof AuditFields[S]] extends infer F
    ? F extends { values: infer V }
      ? V
      : never
    : never;
}[keyof AuditFields];

// How the audit log names one field of a subject and reads its value.
export interface AuditField extends FieldSpec {
  readonly label: AuditFieldLabel;
  readonly values?: AuditValueSet;
}

/**
 * Find how the audit log names a field of a subject, if it does.
 * @param subject what the action changes
 * @param field the recorded field's name
 */
export function auditFieldOf(subject: string, field: string): AuditField | undefined {
  const fields: Readonly<Record<string, Readonly<Record<string, AuditField>>>> = AUDIT_FIELDS;

  return Object.hasOwn(fields, subject) && Object.hasOwn(fields[subject] ?? {}, field)
    ? fields[subject]?.[field]
    : undefined;
}
