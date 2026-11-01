import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import { bootApp, restoreEnv } from '../../testing/boot-app.ts';
import {
  createAdmin,
  createGuardianSession,
  createOrganisation,
  mainHost,
  organisationHost,
} from '../../testing/fixtures.ts';
import { useTestApp } from '../../testing/test-app.ts';
import type { Actor } from '../audit/actor.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { writeSessionCookie } from '../sessions/session-cookie.ts';
import { SessionService } from '../sessions/session.service.ts';
import { Access } from './access.decorator.ts';
import { RequestActor } from './request-actor.decorator.ts';

interface Answer {
  organisationId: string | null;
  actor?: Actor;
}

// Stand in for the features behind each kind of access: each answers with the unit of work it runs in.
@Access('public')
@Controller('test-access/public')
class PublicController {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly sessions: SessionService,
  ) {}

  @Get()
  public read(): Answer {
    return { organisationId: this.unitOfWork.organisationId };
  }

  // Stands in for the login link a guardian opens.
  @Post('guardian-sessions')
  @HttpCode(204)
  public async signIn(@Body() body: { email: string }, @Res({ passthrough: true }) response: Response): Promise<void> {
    writeSessionCookie(response, 'guardian', await this.sessions.startGuardian(body.email));
  }
}

@Access('guardian')
@Controller('test-access/guardian')
class GuardianController {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  @Get()
  public read(@RequestActor() actor: Actor): Answer {
    return { organisationId: this.unitOfWork.organisationId, actor };
  }

  @Post()
  @HttpCode(204)
  public change(): void {}
}

@Access('admin')
@Controller('test-access/admin')
class AdminController {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  @Get()
  public read(@RequestActor() actor: Actor): Answer {
    return { organisationId: this.unitOfWork.organisationId, actor };
  }

  @Post()
  @HttpCode(204)
  public change(): void {}
}

@Access('platform')
@Controller('test-access/platform')
class PlatformController {
  constructor(private readonly sessions: SessionService) {}

  // Stands in for the admin login.
  @Post('admin-sessions')
  @HttpCode(204)
  public async signIn(
    @Body() body: { adminId: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    writeSessionCookie(response, 'admin', await this.sessions.startAdmin(body.adminId));
  }
}

@Access('gateway')
@Controller('test-access/gateway/:organisationId')
class GatewayController {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  @Post()
  @HttpCode(200)
  public notify(): Answer {
    return { organisationId: this.unitOfWork.organisationId };
  }
}

@Controller('test-access/undeclared')
class UndeclaredController {
  @Get()
  public read(): void {}
}

const CSRF = { [ACCESS_HEADERS.csrf]: '1' };

describe('access', () => {
  const { app, http, clock } = useTestApp({
    controllers: [PublicController, GuardianController, AdminController, PlatformController, GatewayController],
  });
  let organisationA: string;
  let organisationB: string;

  beforeEach(async () => {
    organisationA = await createOrganisation(app(), { subdomain: 'tabor-a' });
    organisationB = await createOrganisation(app(), { subdomain: 'tabor-b' });
  });

  describe('Organisation from the host', () => {
    it("runs a public request in the unit of work of the subdomain's Organisation", async () => {
      const response = await http().get('/api/test-access/public').set('Host', 'tabor-a.campie.test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ organisationId: organisationA });
    });

    it('takes the host our proxy forwarded, the last one, over the host it called', async () => {
      const response = await http()
        .get('/api/test-access/public')
        .set('Host', 'api.campie.test')
        .set('X-Forwarded-Host', 'tabor-a.campie.test, tabor-b.campie.test:443');

      expect(response.body).toEqual({ organisationId: organisationB });
    });

    it.each(['neznamy.campie.test', 'app.campie.test', 'campie.test', 'a.tabor-a.campie.test', 'tabor-a.example.com'])(
      'answers not-found on %s, which is no Organisation',
      async (host) => {
        const response = await http().get('/api/test-access/public').set('Host', host);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({ code: 'organisation_unknown' });
      },
    );
  });

  describe('guardian sessions', () => {
    it('admits a guardian session on its own Organisation’s host, acting as that guardian', async () => {
      const guardian = await createGuardianSession(app(), organisationA, 'rodic@example.com');

      const response = await http().get('/api/test-access/guardian').set(guardian.headers);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        organisationId: organisationA,
        actor: { kind: 'guardian', identity: 'rodic@example.com', ipAddress: expect.any(String) },
      });
    });

    it("rejects a guardian session of Organisation A on Organisation B's host", async () => {
      const guardian = await createGuardianSession(app(), organisationA, 'rodic@example.com');

      const response = await http()
        .get('/api/test-access/guardian')
        .set(guardian.headers)
        .set('Host', await organisationHost(app(), organisationB));

      expect(response.status).toBe(401);
    });

    it('rejects a guardian request without a session', async () => {
      const host = await organisationHost(app(), organisationA);

      expect((await http().get('/api/test-access/guardian').set('Host', host)).status).toBe(401);
    });

    it('rejects a guardian session seven days after it started', async () => {
      const guardian = await createGuardianSession(app(), organisationA, 'rodic@example.com');

      clock().advance(7 * 24 * 60 * 60 * 1000 - 1000);
      expect((await http().get('/api/test-access/guardian').set(guardian.headers)).status).toBe(200);
      clock().advance(1000);
      expect((await http().get('/api/test-access/guardian').set(guardian.headers)).status).toBe(401);
    });
  });

  describe('admin sessions', () => {
    it('runs an admin request in the unit of work of the Organisation it names, acting as that admin', async () => {
      const admin = await createAdmin(app(), { memberOf: [organisationA] });

      const response = await http().get('/api/test-access/admin').set(admin.headers(organisationA));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        organisationId: organisationA,
        actor: { kind: 'admin', identity: admin.id, ipAddress: expect.any(String) },
      });
    });

    it('rejects an admin request naming an Organisation the admin has no membership in', async () => {
      const admin = await createAdmin(app(), { memberOf: [organisationA] });

      const response = await http().get('/api/test-access/admin').set(admin.headers(organisationB));

      expect(response.status).toBe(403);
    });

    it('rejects an admin request naming no Organisation, or not an id', async () => {
      const admin = await createAdmin(app(), { memberOf: [organisationA] });
      const { [ACCESS_HEADERS.organisation]: _, ...withoutOrganisation } = admin.headers(organisationA);

      expect((await http().get('/api/test-access/admin').set(withoutOrganisation)).status).toBe(403);
      expect(
        (
          await http()
            .get('/api/test-access/admin')
            .set(admin.headers(organisationA))
            .set(ACCESS_HEADERS.organisation, 'x')
        ).status,
      ).toBe(403);
    });

    it("answers not-found to an admin request on an Organisation's host", async () => {
      const admin = await createAdmin(app(), { memberOf: [organisationA] });

      const response = await http()
        .get('/api/test-access/admin')
        .set(admin.headers(organisationA))
        .set('Host', await organisationHost(app(), organisationA));

      expect(response.status).toBe(404);
    });

    it('rejects an admin request without a session', async () => {
      const response = await http()
        .get('/api/test-access/admin')
        .set({ Host: mainHost(app()), [ACCESS_HEADERS.organisation]: organisationA });

      expect(response.status).toBe(401);
    });

    it('rejects an admin session twelve hours after it started', async () => {
      const admin = await createAdmin(app(), { memberOf: [organisationA] });

      clock().advance(12 * 60 * 60 * 1000 - 1000);
      expect((await http().get('/api/test-access/admin').set(admin.headers(organisationA))).status).toBe(200);
      clock().advance(1000);
      expect((await http().get('/api/test-access/admin').set(admin.headers(organisationA))).status).toBe(401);
    });
  });

  describe('CSRF', () => {
    it('rejects a mutating request without the CSRF header, whatever its session', async () => {
      const admin = await createAdmin(app(), { memberOf: [organisationA] });
      const guardian = await createGuardianSession(app(), organisationA, 'rodic@example.com');
      const { [ACCESS_HEADERS.csrf]: _admin, ...adminHeaders } = admin.headers(organisationA);
      const { [ACCESS_HEADERS.csrf]: _guardian, ...guardianHeaders } = guardian.headers;

      const host = await organisationHost(app(), organisationA);

      for (const send of [
        () => http().post('/api/test-access/admin').set(adminHeaders),
        () => http().post('/api/test-access/guardian').set(guardianHeaders),
        () =>
          http()
            .post('/api/test-access/public/guardian-sessions')
            .set('Host', host)
            .send({ email: 'rodic@example.com' }),
      ]) {
        const response = await send();

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({ code: 'csrf_header_missing' });
        expect(response.headers['set-cookie']).toBeUndefined();
      }

      expect((await http().post('/api/test-access/admin').set(admin.headers(organisationA))).status).toBe(204);
      expect((await http().post('/api/test-access/guardian').set(guardian.headers)).status).toBe(204);
    });

    it('takes a gateway notification without it, in the unit of work of the Organisation in its path', async () => {
      const response = await http().post(`/api/test-access/gateway/${organisationB}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ organisationId: organisationB });

      const unknown = await http().post('/api/test-access/gateway/01900000-0000-7000-8000-000000000000');
      expect(unknown.status).toBe(404);
      expect((await http().post('/api/test-access/gateway/not-an-id')).status).toBe(404);
    });
  });

  describe('cookies', () => {
    it("scopes a guardian cookie to the exact host of its Organisation's subdomain", async () => {
      const response = await http()
        .post('/api/test-access/public/guardian-sessions')
        .set({ Host: await organisationHost(app(), organisationA), ...CSRF })
        .send({ email: 'rodic@example.com' });

      expect(response.status).toBe(204);
      expect(cookieAttributes(response.headers['set-cookie'])).toEqual({
        name: '__Host-guardian_session',
        attributes: ['Expires', 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Secure'],
      });
    });

    it('scopes an admin cookie to the exact main host', async () => {
      const admin = await createAdmin(app(), { memberOf: [organisationA] });

      const response = await http()
        .post('/api/test-access/platform/admin-sessions')
        .set({ Host: mainHost(app()), ...CSRF })
        .send({ adminId: admin.id });

      expect(response.status).toBe(204);
      expect(cookieAttributes(response.headers['set-cookie'])).toEqual({
        name: '__Host-admin_session',
        attributes: ['Expires', 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Secure'],
      });

      const [cookie] = String(response.headers['set-cookie']).split(';');
      const session = await http()
        .get('/api/test-access/admin')
        .set({ Host: mainHost(app()), Cookie: cookie, [ACCESS_HEADERS.organisation]: organisationA });
      expect(session.status).toBe(200);
    });
  });
});

describe('access declarations', () => {
  afterEach(restoreEnv);

  it('refuses to boot with a controller that declares no access', async () => {
    await expect(bootApp({ controllers: [UndeclaredController] })).rejects.toThrow(/UndeclaredController/);
  });
});

/**
 * Read the one cookie a response sets: its name and its attributes without their values, except the path
 * and SameSite. No Domain attribute means the browser keeps it to the exact host.
 * @param header the Set-Cookie header
 */
function cookieAttributes(header: unknown): { name: string; attributes: string[] } {
  expect(header).toHaveLength(1);
  const [pair = '', ...attributes] = String(header)
    .split(';')
    .map((part) => part.trim());

  return {
    name: pair.split('=')[0] ?? '',
    attributes: attributes
      .map((attribute) => (/^(path|samesite)=/i.test(attribute) ? attribute : (attribute.split('=')[0] ?? '')))
      .sort(),
  };
}
