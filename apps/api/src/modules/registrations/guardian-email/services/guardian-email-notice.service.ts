import { Injectable } from '@nestjs/common';

import { EmailService } from '../../../../core/emails/email.service.ts';
import { CampRepository } from '../../../../repositories/camps/camp/camp.repository.ts';
import { TurnusRepository } from '../../../../repositories/camps/turnus/turnus.repository.ts';
import { GuardianEmailChangeRepository } from '../../../../repositories/registrations/guardian-email-change/guardian-email-change.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';
import { CampEmailService } from '../../../camps/camp-email/services/camp-email.service.ts';
import { EmailChangeNoticeEmail } from '../guardian-email-notice.email.tsx';

// The notice a guardian's previous address gets once their email changed, whoever changed it.
@Injectable()
export class GuardianEmailNoticeService {
  constructor(
    private readonly changes: GuardianEmailChangeRepository,
    private readonly registrations: RegistrationRepository,
    private readonly turnusy: TurnusRepository,
    private readonly camps: CampRepository,
    private readonly campEmails: CampEmailService,
    private readonly emails: EmailService,
  ) {}

  /**
   * Tell a guardian's previous address of a confirmed change, naming the new one; the Camp's contact is in
   * the email's footer.
   * @param changeId the change
   */
  public async sendNotice(changeId: string): Promise<void> {
    const change = await this.changes.takeConfirmed(changeId);

    if (change === null) {
      return;
    }

    const registration = await this.registrations.getByIdOrThrow(change.registrationId);
    const turnus = await this.turnusy.getByIdOrThrow(registration.turnusId);
    const camp = await this.camps.getByIdOrThrow(turnus.campId);

    await this.emails.send(
      EmailChangeNoticeEmail,
      { campName: camp.name, email: change.email },
      { to: [change.previousEmail], sender: await this.campEmails.senderFor(camp.id) },
    );
  }
}
