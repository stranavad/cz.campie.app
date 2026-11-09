import { CircleHelpIcon, CreditCardIcon, FileSignatureIcon, HeartPulseIcon, UploadIcon } from 'lucide-react';

// Where a guardian goes to settle an item.
export const CHECKLIST_TARGETS = {
  consent: '/organisation/portal/$registrationId/souhlasy',
  document: '/organisation/portal/$registrationId/dokumenty',
  missing_answers: '/organisation/portal/$registrationId',
} as const;

export const CHECKLIST_ICONS = {
  payment: CreditCardIcon,
  missing_answers: CircleHelpIcon,
  consent: FileSignatureIcon,
  health_record: HeartPulseIcon,
  document: UploadIcon,
} as const;
