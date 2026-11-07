import { ConflictException, Injectable } from '@nestjs/common';

import type { ErasureErrorCode } from '@repo/schema/registrations';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { FileService } from '../../../../core/files/file.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import { ErasureRepository } from '../../../../repositories/registrations/erasure/erasure.repository.ts';
import { RegistrationRepository } from '../../../../repositories/registrations/registration/registration.repository.ts';

// Erasing a Registration to an anonymous accounting tombstone, at an Owner's request. Permission (Owners) is
// the route's.
@Injectable()
export class ErasureService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly erasure: ErasureRepository,
    private readonly files: FileService,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * Erase a Registration: cancel its Registered children, freeing their places; delete every stored file
   * and all personal data; keep the Turnus, Variable symbol, price lines, Price adjustments and ledger;
   * scrub its audit entries; audited.
   * @param actor the Owner
   * @param registrationId Registration id
   * @throws {ConflictException} registration_erased when it was erased already
   */
  public async erase(actor: Actor, registrationId: string): Promise<void> {
    const registration = await this.registrations.lockByIdOrThrow(registrationId);

    if (registration.erasedAt !== null) {
      const code: ErasureErrorCode = 'registration_erased';

      throw new ConflictException({ code, message: 'The Registration was erased already' });
    }

    const participants = await this.registrations.listParticipants(registration.id);
    const ids = participants.map(({ id }) => id);

    await this.registrations.cancelParticipants(
      participants.filter(({ status }) => status === 'registered').map(({ id }) => id),
    );
    // Gathered before the rows naming them go; each file is removed through the file service, which
    // deletes its stored object once this commits.
    const fileIds = await this.erasure.listFilesOf(ids);

    await this.erasure.erase(registration.id, ids, this.clock.now());

    for (const fileId of new Set(fileIds)) {
      await this.files.remove(fileId);
    }

    await this.audit.record(actor, {
      action: 'registration.erase',
      target: { type: 'registration', id: registration.id },
      change: { before: null, after: { participants: participants.length, files: fileIds.length } },
    });
  }
}
