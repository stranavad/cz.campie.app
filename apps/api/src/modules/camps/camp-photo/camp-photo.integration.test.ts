import { beforeEach, describe, expect, it } from 'vitest';

import { MAX_CAMP_PHOTO_BYTES } from '@repo/schema/camps';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { FileService } from '../../../core/files/file.service.ts';
import {
  createAdmin,
  createCamp,
  createOrganisation,
  organisationHost,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const hex = (value: string) => Buffer.from(value.replaceAll(' ', ''), 'hex');

/**
 * A JPEG segment: its marker and a length that counts itself.
 * @param marker the marker's second byte
 * @param data the segment's data
 */
function segment(marker: number, data: Buffer): Buffer {
  const head = Buffer.from([0xff, marker, 0, 0]);
  head.writeUInt16BE(data.length + 2, 2);

  return Buffer.concat([head, data]);
}

// A made-up JPEG as a phone writes one at camp: the picture after an Exif block naming where it was taken,
// and a comment naming who took it.
const PICTURE = [
  segment(0xdb, Buffer.alloc(65, 1)),
  segment(0xc0, hex('08 0001 0001 01 01 11 00')),
  segment(0xc4, Buffer.alloc(20, 2)),
  segment(0xda, hex('01 01 00 00 3f 00')),
  hex('1234 ff00 56'),
  hex('ffd9'),
];
const JPEG_AT_CAMP = Buffer.concat([
  hex('ffd8'),
  segment(
    0xe1,
    Buffer.concat([Buffer.from('Exif\0\0'), hex('4d4d002a 00000008 0000 00000000'), Buffer.from('GPS 49.1N')]),
  ),
  segment(0xfe, Buffer.from('Fotila Jana Testovaci')),
  ...PICTURE,
]);
const JPEG_WITHOUT_METADATA = Buffer.concat([hex('ffd8'), ...PICTURE]);

const PNG = Buffer.concat([
  hex('89504e470d0a1a0a'),
  hex('0000000d 49484452 00000001 00000001 0806000000 00000000'),
  hex('0000000a 49444154 789c6360000000020001 00000000'),
  hex('00000000 49454e44 00000000'),
]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  hex('14000000'),
  Buffer.from('WEBPVP8 '),
  hex('08000000'),
  Buffer.alloc(8, 3),
]);

type Admin = Awaited<ReturnType<typeof createAdmin>>;

describe('camp photo', () => {
  const { app, http, database, files, jobs, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: Admin;
  let host: RequestHeaders;

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor Pokusník', 'letni-pokusnik');
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    host = { Host: await organisationHost(app(), organisationId) };
  });

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  const photo = (headers: RequestHeaders, id = campId) => http().get(`/api/camps/${id}/photo`).set(headers);
  const upload = (headers: RequestHeaders, bytes = JPEG_AT_CAMP, name = 'tabor.jpg', id = campId) =>
    http().put(`/api/camps/${id}/photo`).set(headers).attach('file', bytes, name);
  const remove = (headers: RequestHeaders, id = campId) => http().delete(`/api/camps/${id}/photo`).set(headers);
  const publicCamp = async () => (await http().get('/api/public-camps/letni-pokusnik').set(host)).body;
  const served = (url: string, headers: RequestHeaders = host) => http().get(url).set(headers).buffer(true);

  it('publishes a photo without where and by whom it was taken, on the subdomain without a session', async () => {
    const response = await upload(owner.headers(organisationId));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      photo: { url: expect.stringMatching(/^\/api\/downloads\//), expiresAt: expect.any(String) },
    });

    const { photoUrl } = await publicCamp();
    const [listed] = (await http().get('/api/public-camps').set(host)).body;
    const image = await served(photoUrl);

    expect(photoUrl).toMatch(/^\/api\/camp-photos\/[0-9a-f-]{36}$/);
    expect(listed.photoUrl).toBe(photoUrl);
    expect(image.status).toBe(200);
    expect(image.body).toEqual(JPEG_WITHOUT_METADATA);
    expect(image.headers).toMatchObject({
      'content-type': 'image/jpeg',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; sandbox",
      'cache-control': 'public, max-age=31536000, immutable',
    });
    expect((await photo(owner.headers(organisationId))).body).toEqual({
      photo: { url: expect.any(String), expiresAt: expect.any(String) },
    });
    expect(
      await query('SELECT actor_identity, action, target_type, target_id FROM audit_entries WHERE action LIKE $1', [
        'camp_photo.%',
      ]),
    ).toEqual([{ actor_identity: owner.id, action: 'camp_photo.update', target_type: 'camp', target_id: campId }]);
  });

  it.each([
    [PNG, 'tabor.png', 'image/png'],
    [WEBP, 'tabor.webp', 'image/webp'],
  ])('takes a photo as %#', async (bytes, name, contentType) => {
    await upload(owner.headers(organisationId), bytes, name);

    const image = await served((await publicCamp()).photoUrl);

    expect(image.headers['content-type']).toBe(contentType);
    expect(image.body).toEqual(bytes);
  });

  it('removes the stored photo it replaces or removes, and the old address stops serving', async () => {
    await upload(owner.headers(organisationId));
    const { photoUrl: first } = await publicCamp();

    await upload(owner.headers(organisationId), PNG, 'novy.png');
    const { photoUrl: second } = await publicCamp();

    expect(second).not.toBe(first);
    expect((await served(first)).status).toBe(404);
    await jobs().drain();
    expect(files().objects.size).toBe(1);

    const removed = await remove(owner.headers(organisationId));

    expect(removed.body).toEqual({ photo: null });
    expect((await publicCamp()).photoUrl).toBeNull();
    expect((await served(second)).status).toBe(404);
    expect(await query('SELECT id FROM files')).toEqual([]);
    await jobs().drain();
    expect(files().objects.size).toBe(0);
    expect(
      await query('SELECT action FROM audit_entries WHERE action LIKE $1 ORDER BY occurred_at, id', ['camp_photo.%']),
    ).toEqual([{ action: 'camp_photo.update' }, { action: 'camp_photo.update' }, { action: 'camp_photo.remove' }]);
  });

  it.each([
    [
      'an SVG',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'),
      'tabor.svg',
      400,
      'file_type_not_allowed',
    ],
    [
      'an SVG named as a JPEG',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      'tabor.jpg',
      400,
      'file_type_not_allowed',
    ],
    [
      'HTML behind a JPEG signature',
      Buffer.concat([hex('ffd8ff'), Buffer.from('<html><script>alert(1)</script>')]),
      'tabor.jpg',
      400,
      'file_type_not_allowed',
    ],
    ['a GIF', Buffer.from('GIF89a\x01\x00\x01\x00'), 'tabor.gif', 400, 'file_type_not_allowed'],
    ['a PDF', Buffer.from('%PDF-1.7'), 'tabor.pdf', 400, 'file_type_not_allowed'],
    ['a PNG named as a JPEG', PNG, 'tabor.jpg', 400, 'file_type_not_allowed'],
    [
      'a photo over the limit',
      Buffer.concat([JPEG_AT_CAMP, Buffer.alloc(MAX_CAMP_PHOTO_BYTES)]),
      'tabor.jpg',
      413,
      'file_too_large',
    ],
  ])('refuses %s, storing nothing', async (_case, bytes, name, status, code) => {
    const response = await upload(owner.headers(organisationId), bytes, name);

    expect(response.status).toBe(status);
    expect(response.body).toMatchObject({ code });
    expect(await query('SELECT id FROM files')).toEqual([]);
    expect(files().objects.size).toBe(0);
    expect((await publicCamp()).photoUrl).toBeNull();
    expect(await query('SELECT id FROM audit_entries WHERE action LIKE $1', ['camp_photo.%'])).toEqual([]);
  });

  it('takes Camp settings read to see the photo and write to change it', async () => {
    await expectPermission(['campSettings', 'read'], organisationId, (headers) => photo(headers));
    await expectPermission(['campSettings', 'write'], organisationId, (headers) => upload(headers));
    await expectPermission(['campSettings', 'write'], organisationId, (headers) => remove(headers));
  });

  it("keeps another Organisation's admins away from the Camp's photo, even by its id", async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });

    await expectIsolated(() => photo(otherOwner.headers(otherId)));
    await expectIsolated(() => upload(otherOwner.headers(otherId)));
    await expectIsolated(() => remove(otherOwner.headers(otherId)));
  });

  it("serves no file but a Camp's photo, and no other Organisation's photo on this subdomain", async () => {
    // Another file of the same Organisation, such as a guardian's upload, and the Camp's logo.
    const notAPhoto = await app()
      .get(UnitOfWork)
      .run(organisationId, () => app().get(FileService).store({ name: 'karta.png', bytes: PNG }));
    await http()
      .put(`/api/camps/${campId}/branding/logo`)
      .set(owner.headers(organisationId))
      .attach('file', PNG, 'logo.png');
    const [{ logo_file_id: logo }] = await query<{ logo_file_id: string }>('SELECT logo_file_id FROM camps');
    const otherId = await createOrganisation(app());
    const otherCampId = await createCamp(app(), otherId, 'Cizí tábor', 'cizi-tabor');
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });
    await upload(otherOwner.headers(otherId), JPEG_AT_CAMP, 'tabor.jpg', otherCampId);
    const otherPhotoUrl = (
      await http()
        .get('/api/public-camps/cizi-tabor')
        .set({ Host: await organisationHost(app(), otherId) })
    ).body.photoUrl;

    expect((await served(`/api/camp-photos/${notAPhoto}`)).status).toBe(404);
    expect((await served(`/api/camp-photos/${logo}`)).status).toBe(404);
    await expectIsolated(() => served(otherPhotoUrl));
  });
});
