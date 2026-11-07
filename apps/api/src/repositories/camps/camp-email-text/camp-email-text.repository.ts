import { Injectable } from '@nestjs/common';
import { and, eq, type InferSelectModel } from 'drizzle-orm';

import type { EmailType } from '@repo/schema/emails';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { campEmailTexts } from '../../../db/schema.ts';

export type CampEmailTextRow = Omit<InferSelectModel<typeof campEmailTexts>, 'organisationId'>;

// A Camp's own email wording; rows are plain configuration, shaped into the resource by the service with
// the platform's defaults.
@Injectable()
export class CampEmailTextRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * List the email types a Camp wrote its own wording for.
   * @param campId Camp id
   */
  public async listByCamp(campId: string): Promise<CampEmailTextRow[]> {
    return this.unitOfWork.db
      .select({
        campId: campEmailTexts.campId,
        type: campEmailTexts.type,
        subject: campEmailTexts.subject,
        text: campEmailTexts.text,
        enabled: campEmailTexts.enabled,
      })
      .from(campEmailTexts)
      .where(eq(campEmailTexts.campId, campId));
  }

  /**
   * Save a Camp's own wording of an email type, replacing what it had.
   * @param row the Camp, type, subject, text and switch
   */
  public async save(row: CampEmailTextRow): Promise<void> {
    await this.unitOfWork.db
      .insert(campEmailTexts)
      .values({ ...row, organisationId: this.unitOfWork.organisationId })
      .onConflictDoUpdate({
        target: [campEmailTexts.organisationId, campEmailTexts.campId, campEmailTexts.type],
        set: { subject: row.subject, text: row.text, enabled: row.enabled },
      });
  }

  /**
   * Forget a Camp's own wording of an email type.
   * @param campId Camp id
   * @param type the email type
   */
  public async remove(campId: string, type: EmailType): Promise<void> {
    await this.unitOfWork.db
      .delete(campEmailTexts)
      .where(and(eq(campEmailTexts.campId, campId), eq(campEmailTexts.type, type)));
  }
}
