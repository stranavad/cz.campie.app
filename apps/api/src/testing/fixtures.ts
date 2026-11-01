import type { INestApplication } from '@nestjs/common';

import { UnitOfWork } from '../core/database/unit-of-work.ts';
import { organisations } from '../db/schema.ts';

// Fixtures create the world through the app's own seams, so the data is what the app itself would hold.

/**
 * Create an Organisation.
 * @param app the running test app
 */
export async function createOrganisation(app: INestApplication): Promise<string> {
  const unitOfWork = app.get(UnitOfWork);
  const [organisation] = await unitOfWork.runForPlatform(() =>
    unitOfWork.db.insert(organisations).values({}).returning({ id: organisations.id }),
  );

  if (organisation === undefined) {
    throw new Error('The Organisation was not created');
  }

  return organisation.id;
}
