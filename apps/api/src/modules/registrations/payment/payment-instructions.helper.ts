import qrcode from 'qrcode';

import { paymentInstructionsOf, type PaymentInstructions } from '@repo/schema/payments';

import type { CampEntity } from '../../../repositories/camps/camp/camp.entity.ts';
import type { OrganisationEntity } from '../../../repositories/organisations/organisation/organisation.entity.ts';
import type { RegistrationEntity } from '../../../repositories/registrations/registration/registration.entity.ts';

// Error correction a printed or photographed QR platba still reads with.
const QR_OPTIONS = { margin: 2, errorCorrectionLevel: 'M' } as const;

/**
 * Tell how to pay a Registration, the same way on the Přihláška, in emails and in the portal: by its own
 * due dates, to its Organisation's account, with the Camp's name as the message.
 * @param of the Registration, its Camp and Organisation, its total and what is paid
 */
export function registrationPaymentOf(of: {
  readonly registration: RegistrationEntity;
  readonly camp: CampEntity;
  readonly organisation: OrganisationEntity;
  readonly total: number;
  readonly paid: number;
}): PaymentInstructions {
  return paymentInstructionsOf({
    total: of.total,
    depositTotal: of.registration.depositTotal,
    paid: of.paid,
    depositDueDate: of.registration.depositDueDate,
    balanceDueDate: of.registration.balanceDueDate,
    account: of.organisation.bankAccount,
    variableSymbol: of.registration.variableSymbol,
    message: of.camp.name,
  });
}

/**
 * Draw a QR platba as SVG markup, for a document.
 * @param qrPlatba the payment descriptor
 */
export function qrPlatbaSvg(qrPlatba: string): Promise<string> {
  return qrcode.toString(qrPlatba, { ...QR_OPTIONS, type: 'svg' });
}

/**
 * Draw a QR platba as a PNG, for an email.
 * @param qrPlatba the payment descriptor
 */
export function qrPlatbaPng(qrPlatba: string): Promise<Buffer> {
  return qrcode.toBuffer(qrPlatba, { ...QR_OPTIONS, type: 'png', width: 320 });
}
