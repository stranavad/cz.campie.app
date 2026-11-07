import { Global, Module } from '@nestjs/common';

import { AdminRepository } from './admins/admin/admin.repository.ts';
import { InvitationRepository } from './admins/invitation/invitation.repository.ts';
import { MembershipRepository } from './admins/membership/membership.repository.ts';
import { PasswordResetRepository } from './admins/password-reset/password-reset.repository.ts';
import { TotpCredentialRepository } from './admins/totp-credential/totp-credential.repository.ts';
import { AuditEntryRepository } from './audit/audit-entry/audit-entry.repository.ts';
import { PlatformAuditEntryRepository } from './audit/platform-audit-entry/platform-audit-entry.repository.ts';
import { CampEmailTextRepository } from './camps/camp-email-text/camp-email-text.repository.ts';
import { CampRepository } from './camps/camp/camp.repository.ts';
import { DiscountCodeRepository } from './camps/discount-code/discount-code.repository.ts';
import { RegistrationFormRepository } from './camps/registration-form/registration-form.repository.ts';
import { TurnusRepository } from './camps/turnus/turnus.repository.ts';
import { ConsentSignatureRepository } from './consents/consent-signature/consent-signature.repository.ts';
import { ConsentRepository } from './consents/consent/consent.repository.ts';
import { ProblemReportRepository } from './console/problem-report/problem-report.repository.ts';
import { DocumentTypeRepository } from './documents/document-type/document-type.repository.ts';
import { DocumentUploadRepository } from './documents/document-upload/document-upload.repository.ts';
import { FileRepository } from './files/file/file.repository.ts';
import { OperatorRepository } from './operators/operator/operator.repository.ts';
import { LegalAcceptanceRepository } from './organisations/legal-acceptance/legal-acceptance.repository.ts';
import { OrganisationKeyRepository } from './organisations/organisation-key/organisation-key.repository.ts';
import { OrganisationRepository } from './organisations/organisation/organisation.repository.ts';
import { PaymentGatewayAccountRepository } from './organisations/payment-gateway-account/payment-gateway-account.repository.ts';
import { SupportGrantRepository } from './organisations/support-grant/support-grant.repository.ts';
import { CardPaymentRepository } from './registrations/card-payment/card-payment.repository.ts';
import { ClaimedDiscountVerificationRepository } from './registrations/claimed-discount-verification/claimed-discount-verification.repository.ts';
import { GuardianEmailChangeRepository } from './registrations/guardian-email-change/guardian-email-change.repository.ts';
import { ParticipantExportRepository } from './registrations/participant-export/participant-export.repository.ts';
import { PaymentRepository } from './registrations/payment/payment.repository.ts';
import { PriceAdjustmentRepository } from './registrations/price-adjustment/price-adjustment.repository.ts';
import { RegistrationRepository } from './registrations/registration/registration.repository.ts';
import { AdminSessionRepository } from './sessions/admin-session/admin-session.repository.ts';
import { GuardianLoginLinkRepository } from './sessions/guardian-login-link/guardian-login-link.repository.ts';
import { GuardianSessionRepository } from './sessions/guardian-session/guardian-session.repository.ts';

const REPOSITORIES = [
  OrganisationRepository,
  OrganisationKeyRepository,
  PaymentGatewayAccountRepository,
  SupportGrantRepository,
  ProblemReportRepository,
  CardPaymentRepository,
  ConsentRepository,
  ConsentSignatureRepository,
  DocumentTypeRepository,
  DocumentUploadRepository,
  LegalAcceptanceRepository,
  AdminRepository,
  MembershipRepository,
  InvitationRepository,
  PasswordResetRepository,
  TotpCredentialRepository,
  OperatorRepository,
  AdminSessionRepository,
  GuardianSessionRepository,
  GuardianLoginLinkRepository,
  AuditEntryRepository,
  PlatformAuditEntryRepository,
  FileRepository,
  CampRepository,
  CampEmailTextRepository,
  TurnusRepository,
  DiscountCodeRepository,
  RegistrationFormRepository,
  RegistrationRepository,
  PaymentRepository,
  PriceAdjustmentRepository,
  GuardianEmailChangeRepository,
  ClaimedDiscountVerificationRepository,
  ParticipantExportRepository,
];

@Global()
@Module({
  providers: REPOSITORIES,
  exports: REPOSITORIES,
})
export class RepositoriesModule {}
