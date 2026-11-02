import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import type { Env } from '../core/config/env.schema.ts';
import { UnitOfWork } from '../core/database/unit-of-work.ts';
import { FileService } from '../core/files/file.service.ts';
import { hashPassword } from '../core/passwords/password-hash.ts';
import { SESSION_COOKIES } from '../core/sessions/session-cookie.ts';
import { SessionService } from '../core/sessions/session.service.ts';
import { AdminService } from '../modules/admins/admin/services/admin.service.ts';
import { OrganisationService } from '../modules/organisations/organisation/services/organisation.service.ts';
import { MembershipRepository } from '../repositories/admins/membership/membership.repository.ts';
import {
  OrganisationRepository,
  type CreateOrganisation,
} from '../repositories/organisations/organisation/organisation.repository.ts';

// Fixtures create the world through the app's own seams, so the data is what the app itself would hold.

// Request headers as the app sends them through the frontend's proxy: the host the browser called, the
// session cookie and the CSRF header every mutation needs.
export type RequestHeaders = Record<string, string>;

/**
 * Create an Organisation, with its data key.
 * @param app the running test app
 * @param options the subdomain, legal identity and branding; unique and made up where omitted
 */
export async function createOrganisation(
  app: INestApplication,
  options: Partial<Omit<CreateOrganisation, 'logoFileId'>> = {},
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const organisation = await app.get(UnitOfWork).runForPlatform(() =>
    app.get(OrganisationService).create({
      subdomain: `tabor-${suffix}`,
      legalName: `Testovací spolek ${suffix} z. s.`,
      ico: '12345678',
      address: 'Smyšlená 1, 123 45 Testov',
      statutoryRepresentative: 'Jana Testovací',
      contactEmail: `kontakt-${suffix}@example.com`,
      contactPhone: '+420 123 456 789',
      billingEmail: `fakturace-${suffix}@example.com`,
      displayName: `Tábor ${suffix}`,
      ...options,
    }),
  );

  return organisation.id;
}

/**
 * Change an Organisation's legal name, accent colour or logo, as its Owner would in its settings.
 * @param app the running test app
 * @param organisationId the Organisation
 * @param changes the new values; the logo as the bytes of a PNG
 */
export async function brandOrganisation(
  app: INestApplication,
  organisationId: string,
  { logo, ...changes }: { legalName?: string; accentColour?: string; logo?: Buffer },
): Promise<void> {
  await app.get(UnitOfWork).run(organisationId, async () => {
    const logoFileId =
      logo === undefined ? undefined : await app.get(FileService).store({ name: 'logo.png', bytes: logo });

    await app.get(OrganisationRepository).update(organisationId, { ...changes, logoFileId });
  });
}

/**
 * Build the main host of the test platform, for admin and platform requests.
 * @param app the running test app
 */
export function mainHost(app: INestApplication): string {
  return `app.${platformDomain(app)}`;
}

/**
 * Build the host of an Organisation's subdomain, for public and guardian requests.
 * @param app the running test app
 * @param organisationId the Organisation
 */
export async function organisationHost(app: INestApplication, organisationId: string): Promise<string> {
  const organisation = await app
    .get(UnitOfWork)
    .runForPlatform(() => app.get(OrganisationRepository).getById(organisationId));

  if (organisation === null) {
    throw new Error(`No Organisation ${organisationId}`);
  }

  return `${organisation.subdomain}.${platformDomain(app)}`;
}

/**
 * Create an admin who is a member of the given Organisations, signed in, with the headers of a request
 * in one of them as that admin.
 * @param app the running test app
 * @param options the Organisations the admin is a member of, and their password; none as if invited
 */
export async function createAdmin(
  app: INestApplication,
  { memberOf, password }: { memberOf: readonly string[]; password?: string },
): Promise<{ id: string; email: string; headers: (organisationId: string) => RequestHeaders }> {
  const unitOfWork = app.get(UnitOfWork);
  const passwordHash = password === undefined ? undefined : await hashPassword(password);

  const admin = await unitOfWork.runForPlatform(() =>
    app.get(AdminService).create({ email: `admin-${randomUUID()}@example.com`, passwordHash }),
  );

  // Arranged without an audit entry, so a test's audit log holds only what the test itself did.
  for (const organisationId of memberOf) {
    await unitOfWork.run(organisationId, () =>
      app.get(MembershipRepository).create({ adminId: admin.id, owner: false }),
    );
  }

  const session = await unitOfWork.runForPlatform(() => app.get(SessionService).startAdmin(admin.id));
  const host = mainHost(app);

  return {
    id: admin.id,
    email: admin.email,
    headers: (organisationId) => ({
      Host: host,
      Cookie: `${SESSION_COOKIES.admin}=${session.token}`,
      [ACCESS_HEADERS.organisation]: organisationId,
      [ACCESS_HEADERS.csrf]: '1',
    }),
  };
}

/**
 * Sign a guardian in to an Organisation's portal, with the headers of a request on its subdomain.
 * @param app the running test app
 * @param organisationId the Organisation
 * @param email the guardian's email, obviously fake
 */
export async function createGuardianSession(
  app: INestApplication,
  organisationId: string,
  email: string,
): Promise<{ headers: RequestHeaders }> {
  const session = await app.get(UnitOfWork).run(organisationId, () => app.get(SessionService).startGuardian(email));

  return {
    headers: {
      Host: await organisationHost(app, organisationId),
      Cookie: `${SESSION_COOKIES.guardian}=${session.token}`,
      [ACCESS_HEADERS.csrf]: '1',
    },
  };
}

function platformDomain(app: INestApplication): string {
  return app.get<ConfigService<Env, true>>(ConfigService).get('PLATFORM_DOMAIN', { infer: true });
}
