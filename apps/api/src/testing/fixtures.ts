import type { INestApplication } from '@nestjs/common';

import { UnitOfWork } from '../core/database/unit-of-work.ts';
import { OrganisationService } from '../modules/organisations/organisation/services/organisation.service.ts';

// Fixtures create the world through the app's own seams, so the data is what the app itself would hold.

/**
 * Create an Organisation, with its data key.
 * @param app the running test app
 */
export async function createOrganisation(app: INestApplication): Promise<string> {
  const organisation = await app.get(UnitOfWork).runForPlatform(() => app.get(OrganisationService).create());

  return organisation.id;
}
