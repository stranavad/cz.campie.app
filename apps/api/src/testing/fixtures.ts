import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Permissions } from '@repo/schema/admins';
import type { TurnusBody } from '@repo/schema/camps';
import type { PaymentChoice } from '@repo/schema/pricing';
import { ACCESS_HEADERS, slugify } from '@repo/schema/shared';

import type { Env } from '../core/config/env.schema.ts';
import { UnitOfWork } from '../core/database/unit-of-work.ts';
import { FileService } from '../core/files/file.service.ts';
import { hashPassword } from '../core/passwords/password-hash.ts';
import { SESSION_COOKIES } from '../core/sessions/session-cookie.ts';
import { SessionService } from '../core/sessions/session.service.ts';
import { AdminService } from '../modules/admins/admin/services/admin.service.ts';
import { CampService } from '../modules/camps/camp/services/camp.service.ts';
import { RegistrationFormService } from '../modules/camps/registration-form/services/registration-form.service.ts';
import { TurnusService } from '../modules/camps/turnus/services/turnus.service.ts';
import { OrganisationService } from '../modules/organisations/organisation/services/organisation.service.ts';
import { RegistrationService } from '../modules/registrations/registration/services/registration.service.ts';
import { MembershipRepository } from '../repositories/admins/membership/membership.repository.ts';
import { CampRepository } from '../repositories/camps/camp/camp.repository.ts';
import { RegistrationFormRepository } from '../repositories/camps/registration-form/registration-form.repository.ts';
import {
  OrganisationRepository,
  type CreateOrganisation,
} from '../repositories/organisations/organisation/organisation.repository.ts';

// Fixtures create the world through the app's own seams, so the data is what the app itself would hold.

// Request headers as the app sends them through the frontend's proxy: the host the browser called, the
// session cookie and the CSRF header every mutation needs.
export type RequestHeaders = Record<string, string>;

/**
 * Create an Organisation, with its data key, approved unless the options say otherwise.
 * @param app the running test app
 * @param options the subdomain, status, legal identity and branding; unique and made up where omitted
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
      status: 'approved',
      ...options,
    }),
  );

  return organisation.id;
}

/**
 * Change an Organisation's legal name, accent colour, logo or bank account, as its Owner would in its
 * settings.
 * @param app the running test app
 * @param organisationId the Organisation
 * @param changes the new values; the logo as the bytes of a PNG, the account in its canonical form
 */
export async function brandOrganisation(
  app: INestApplication,
  organisationId: string,
  { logo, ...changes }: { legalName?: string; accentColour?: string; logo?: Buffer; bankAccount?: string },
): Promise<void> {
  await app.get(UnitOfWork).run(organisationId, async () => {
    const logoFileId =
      logo === undefined ? undefined : await app.get(FileService).store({ name: 'logo.png', bytes: logo });

    await app.get(OrganisationRepository).update(organisationId, { ...changes, logoFileId });
  });
}

/**
 * Create a Camp in an Organisation, without contact or modules.
 * @param app the running test app
 * @param organisationId the Organisation
 * @param name the Camp's name
 * @param slug the Camp's slug, from its name where omitted
 */
export async function createCamp(
  app: INestApplication,
  organisationId: string,
  name = 'Letní tábor',
  slug = slugify(name),
): Promise<string> {
  const camp = await app
    .get(UnitOfWork)
    .run(organisationId, () =>
      app
        .get(CampService)
        .create(
          { kind: 'system' },
          { name, slug, websiteUrl: null, contactName: null, contactEmail: null, contactPhone: null },
        ),
    );

  return camp.id;
}

// A Turnus that takes Registrations whenever a test runs, for children of any age.
export const OPEN_TURNUS = {
  name: 'Turnus 1',
  startDate: '2027-07-04',
  endDate: '2027-07-17',
  place: 'Pokusov',
  capacity: 40,
  minAge: null,
  maxAge: null,
  opensAt: null,
  closesAt: null,
  closedManually: false,
  websiteUrl: null,
  basePrice: 6500,
  earlyBirdPrice: null,
  earlyBirdLastDay: null,
  deposit: null,
  depositDueDays: 14,
  balanceDueDate: null,
} as const;

/**
 * Submit a Registration of one made-up child to a Camp, as a guardian would, with a new open Turnus and the
 * core-only form published first where the Camp has none.
 * @param app the running test app
 * @param organisationId the Organisation
 * @param campId the Camp
 * @param options the code typed, a second guardian, the Turnus's prices and dates, the Deposit chosen
 */
export async function submitRegistration(
  app: INestApplication,
  organisationId: string,
  campId: string,
  options: {
    discountCode?: string;
    secondGuardian?: boolean;
    turnus?: Partial<TurnusBody>;
    // An existing Turnus to register to instead of a new one.
    turnusId?: string;
    paymentChoice?: PaymentChoice;
    // The answers asked once beyond the guardians, such as transport.
    answers?: Readonly<Record<string, string>>;
    // Each child's answers, the core ones included.
    children?: readonly Readonly<Record<string, string | boolean>>[];
  } = {},
): Promise<{ id: string; variableSymbol: string }> {
  const {
    discountCode = null,
    secondGuardian = false,
    turnus: change = {},
    paymentChoice = 'full',
    children = [{ firstName: 'Ema', lastName: 'Testovací', birthDate: '2016-05-01' }],
  } = options;

  return app.get(UnitOfWork).run(organisationId, async () => {
    const system = { kind: 'system' } as const;
    const camp = await app.get(CampRepository).getByIdOrThrow(campId);
    const turnus =
      options.turnusId === undefined
        ? await app.get(TurnusService).create(system, campId, { ...OPEN_TURNUS, ...change })
        : { id: options.turnusId };
    const forms = app.get(RegistrationFormRepository);
    const form =
      (await forms.getLatestVersion(campId)) ?? (await app.get(RegistrationFormService).publish(system, campId));

    return app.get(RegistrationService).submit(
      camp.slug,
      {
        idempotencyKey: randomUUID(),
        turnusId: turnus.id,
        submission: {
          registration: {
            guardianFirstName: 'Jana',
            guardianLastName: 'Testovací',
            guardianEmail: 'jana.testovaci@example.com',
            guardianPhone: '+420 123 456 789',
            ...options.answers,
            ...(secondGuardian
              ? {
                  secondGuardianFirstName: 'Petr',
                  secondGuardianLastName: 'Testovací',
                  secondGuardianEmail: 'petr.testovaci@example.com',
                }
              : {}),
          },
          participants: children.map((child) => ({ ...child })),
        },
        paymentChoice,
        discountCode,
        declarations: form.declarations.map(({ id }) => ({ id, accepted: true })),
      },
      '203.0.113.7',
    );
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
 * @param options the Organisations the admin is a member of; whether an Owner of each, and their level per
 * area in each, none where left out; their password, none as if invited
 */
export async function createAdmin(
  app: INestApplication,
  {
    memberOf,
    owner = false,
    permissions,
    password,
  }: { memberOf: readonly string[]; owner?: boolean; permissions?: Partial<Permissions>; password?: string },
): Promise<{ id: string; email: string; headers: (organisationId: string) => RequestHeaders }> {
  const unitOfWork = app.get(UnitOfWork);
  const passwordHash = password === undefined ? undefined : await hashPassword(password);

  const admin = await unitOfWork.runForPlatform(() =>
    app.get(AdminService).create({ email: `admin-${randomUUID()}@example.com`, passwordHash }),
  );

  // Arranged without an audit entry, so a test's audit log holds only what the test itself did.
  for (const organisationId of memberOf) {
    await unitOfWork.run(organisationId, () =>
      app.get(MembershipRepository).create({ adminId: admin.id, owner, permissions }),
    );
  }

  const headers = await signIn(app, admin.id);

  return {
    id: admin.id,
    email: admin.email,
    headers: (organisationId) => ({ ...headers, [ACCESS_HEADERS.organisation]: organisationId }),
  };
}

/**
 * Start a session for an existing admin, with the headers of a request on the main host outside any
 * Organisation as that admin.
 * @param app the running test app
 * @param adminId the admin
 */
export async function signIn(app: INestApplication, adminId: string): Promise<RequestHeaders> {
  const session = await app.get(UnitOfWork).runForPlatform(() => app.get(SessionService).startAdmin(adminId));

  return {
    Host: mainHost(app),
    Cookie: `${SESSION_COOKIES.admin}=${session.token}`,
    [ACCESS_HEADERS.csrf]: '1',
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
