import { ConflictException, Controller, Delete, Headers, HttpCode, Param, Post, UseInterceptors } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { fileLinkSchema, type FileLink } from '@repo/schema/files';

import { createOrganisation } from '../../testing/fixtures.ts';
import { withClient } from '../../testing/services/postgres.ts';
import { useTestApp } from '../../testing/test-app.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { FileUploadInterceptor, UploadedFile, type FileUpload } from './file-upload.ts';
import { FileService } from './file.service.ts';

// Test only: stands in for a session until sessions exist. Real routes never take the Organisation from
// client input.
const ORGANISATION = 'x-test-organisation';

// Stands in for the features that will upload, link and delete files, each after its own permission check.
@Controller('test-files')
class TestFilesController {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly files: FileService,
  ) {}

  @Post()
  @UseInterceptors(FileUploadInterceptor)
  public upload(@Headers(ORGANISATION) organisationId: string, @UploadedFile() upload: FileUpload) {
    return this.unitOfWork.run(organisationId, async () => ({ id: await this.files.store(upload) }));
  }

  // A feature that stores a file and then fails, rolling its unit of work back.
  @Post('failing')
  @UseInterceptors(FileUploadInterceptor)
  public uploadThenFail(@Headers(ORGANISATION) organisationId: string, @UploadedFile() upload: FileUpload) {
    return this.unitOfWork.run(organisationId, async () => {
      await this.files.store(upload);

      throw new ConflictException();
    });
  }

  @Post(':id/link')
  public link(@Headers(ORGANISATION) organisationId: string, @Param('id') id: string) {
    return this.unitOfWork.run(organisationId, () => this.files.link(id));
  }

  @Delete(':id')
  @HttpCode(204)
  public remove(@Headers(ORGANISATION) organisationId: string, @Param('id') id: string) {
    return this.unitOfWork.run(organisationId, () => this.files.remove(id));
  }
}

// Obviously fake documents: the smallest bytes each type is recognised by, plus a readable marker.
const PDF = Buffer.from('%PDF-1.7\n% fake health report of Testovací Dítě\n%%EOF\n');
const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('fake scan')]);
const JPEG = Buffer.concat([Buffer.from('ffd8ffe0', 'hex'), Buffer.from('fake photo')]);

describe('files', () => {
  const { app, http, files, database, clock, jobs, expectIsolated } = useTestApp({
    controllers: [TestFilesController],
  });

  const send = (organisationId: string, bytes: Buffer, name: string) =>
    http().post('/api/test-files').set(ORGANISATION, organisationId).attach('file', bytes, name);

  const upload = async (organisationId: string, bytes: Buffer, name: string): Promise<string> => {
    const response = await send(organisationId, bytes, name);
    expect(response.status).toBe(201);

    return (response.body as { id: string }).id;
  };

  const requestLink = async (organisationId: string, fileId: string): Promise<FileLink> => {
    const response = await http().post(`/api/test-files/${fileId}/link`).set(ORGANISATION, organisationId);
    expect(response.status).toBe(201);

    return fileLinkSchema.parse(response.body);
  };

  const countFileRecords = async () => {
    const { rows } = await withClient(database().ownerUrl, (client) =>
      client.query<{ count: number }>('SELECT count(*)::int AS count FROM files'),
    );

    return rows[0]?.count;
  };

  it('stores an upload only as ciphertext', async () => {
    const organisationId = await createOrganisation(app());

    const response = await send(organisationId, PDF, 'zprava.pdf');

    expect(response.status).toBe(201);
    const stored = [...files().objects.values()];
    expect(stored).toHaveLength(1);
    expect(stored[0]?.includes('Testovací Dítě')).toBe(false);
    expect(stored[0]?.includes('%PDF')).toBe(false);
  });

  it.each([
    ['text named as a PDF', Buffer.from('<script>alert(1)</script>'), 'zprava.pdf'],
    ['an empty file', Buffer.alloc(0), 'zprava.pdf'],
    ['a PDF named as something else', PDF, 'zprava.html'],
    ['a PNG named as a PDF', PNG, 'sken.pdf'],
  ])('rejects %s and stores nothing', async (_case, bytes, name) => {
    const organisationId = await createOrganisation(app());

    const response = await send(organisationId, bytes, name);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: 'file_type_not_allowed' });
    expect(files().objects.size).toBe(0);
    expect(await countFileRecords()).toBe(0);
  });

  it.each([
    [PDF, 'Zpráva lékaře.PDF'],
    [JPEG, 'foto.jpeg'],
    [JPEG, 'foto.JPG'],
    [PNG, 'sken.png'],
  ])('accepts a PDF, JPG or PNG whose name agrees with its content: %#', async (bytes, name) => {
    const organisationId = await createOrganisation(app());

    const response = await send(organisationId, bytes, name);

    expect(response.status).toBe(201);
  });

  it('rejects a file over 10 MB and stores nothing', async () => {
    const organisationId = await createOrganisation(app());
    const tooLarge = Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024 + 1 - PDF.length)]);

    const response = await send(organisationId, tooLarge, 'zprava.pdf');

    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({ code: 'file_too_large' });
    expect(files().objects.size).toBe(0);
    expect(await countFileRecords()).toBe(0);
  });

  it('accepts a file of exactly 10 MB', async () => {
    const organisationId = await createOrganisation(app());
    const largest = Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024 - PDF.length)]);

    const response = await send(organisationId, largest, 'zprava.pdf');

    expect(response.status).toBe(201);
  });

  it('rejects a request without a file', async () => {
    const organisationId = await createOrganisation(app());

    const response = await http().post('/api/test-files').set(ORGANISATION, organisationId).field('label', 'zpráva');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: 'file_missing' });
  });

  it('opens a file inline through its link, with its type and name, and keeps it out of caches', async () => {
    const organisationId = await createOrganisation(app());
    const fileId = await upload(organisationId, PDF, 'Zpráva lékaře.pdf');

    const link = await requestLink(organisationId, fileId);
    const download = await http().get(link.url).buffer(true);

    expect(download.status).toBe(200);
    expect(download.body).toEqual(PDF);
    expect(download.headers).toMatchObject({
      'content-type': 'application/pdf',
      'content-length': String(PDF.length),
      'content-disposition': `inline; filename="Zprava lekare.pdf"; filename*=UTF-8''Zpr%C3%A1va%20l%C3%A9ka%C5%99e.pdf`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    });
  });

  it('serves an image with its own type', async () => {
    const organisationId = await createOrganisation(app());
    const fileId = await upload(organisationId, PNG, 'sken.png');

    const download = await http()
      .get((await requestLink(organisationId, fileId)).url)
      .buffer(true);

    expect(download.headers['content-type']).toBe('image/png');
    expect(download.body).toEqual(PNG);
  });

  it('aborts the download of a file whose ciphertext was altered instead of ending it as complete', async () => {
    const organisationId = await createOrganisation(app());
    // Past the first 64 KiB segment, so verified bytes are already on their way when the last one fails.
    const fileId = await upload(organisationId, Buffer.concat([PDF, Buffer.alloc(100 * 1024)]), 'zprava.pdf');
    for (const ciphertext of files().objects.values()) {
      ciphertext.writeUInt8(ciphertext.readUInt8(ciphertext.length - 1) ^ 1, ciphertext.length - 1);
    }

    await expect(
      http()
        .get((await requestLink(organisationId, fileId)).url)
        .buffer(true),
    ).rejects.toThrow('aborted');
  });

  it('opens a link until its five minutes are up, and not after', async () => {
    const organisationId = await createOrganisation(app());
    const fileId = await upload(organisationId, PDF, 'zprava.pdf');
    const link = await requestLink(organisationId, fileId);

    expect(link.expiresAt).toBe(new Date(clock().now().getTime() + 5 * 60 * 1000).toISOString());
    clock().advance(5 * 60 * 1000 - 1000);
    expect((await http().get(link.url)).status).toBe(200);
    clock().advance(1000);
    expect((await http().get(link.url)).status).toBe(404);
  });

  it('refuses a link whose token was altered', async () => {
    const organisationId = await createOrganisation(app());
    const fileId = await upload(organisationId, PDF, 'zprava.pdf');
    const { url } = await requestLink(organisationId, fileId);
    const later = String(Math.floor(clock().now().getTime() / 1000) + 3600);
    const parts = url.split('.');

    const extended = [...parts.slice(0, 2), later, parts[3]].join('.');

    expect((await http().get(extended)).status).toBe(404);
    expect((await http().get(`${url.slice(0, -2)}AA`)).status).toBe(404);
    expect((await http().get('/api/downloads/not-a-token')).status).toBe(404);
  });

  it("never links or opens another Organisation's file", async () => {
    const organisationA = await createOrganisation(app());
    const organisationB = await createOrganisation(app());
    const fileOfA = await upload(organisationA, PDF, 'zprava.pdf');
    const fileOfB = await upload(organisationB, PDF, 'zprava.pdf');
    const linkOfB = await requestLink(organisationB, fileOfB);

    await expectIsolated(() => http().post(`/api/test-files/${fileOfA}/link`).set(ORGANISATION, organisationB));
    // B's valid link with A's file id swapped in.
    await expectIsolated(() => http().get(linkOfB.url.replace(fileOfB, fileOfA)));
    await expectIsolated(() => http().get(linkOfB.url.replace(fileOfB, fileOfA).replace(organisationB, organisationA)));
    expect((await http().get(linkOfB.url)).status).toBe(200);
  });

  it('removes the stored object once the deletion of its record commits', async () => {
    const organisationId = await createOrganisation(app());
    const fileId = await upload(organisationId, PDF, 'zprava.pdf');
    const link = await requestLink(organisationId, fileId);

    const response = await http().delete(`/api/test-files/${fileId}`).set(ORGANISATION, organisationId);

    expect(response.status).toBe(204);
    expect(await countFileRecords()).toBe(0);
    expect((await http().get(link.url)).status).toBe(404);
    expect(await jobs().drain()).toEqual([{ job: 'files.delete-stored', outcome: 'completed' }]);
    expect(files().objects.size).toBe(0);
  });

  it("never deletes another Organisation's file", async () => {
    const organisationA = await createOrganisation(app());
    const organisationB = await createOrganisation(app());
    const fileOfA = await upload(organisationA, PDF, 'zprava.pdf');

    await expectIsolated(() => http().delete(`/api/test-files/${fileOfA}`).set(ORGANISATION, organisationB));
    expect(await jobs().drain()).toEqual([]);
    expect(files().objects.size).toBe(1);
  });

  it('removes the stored object of an upload whose unit of work rolls back', async () => {
    const organisationId = await createOrganisation(app());

    const response = await http()
      .post('/api/test-files/failing')
      .set(ORGANISATION, organisationId)
      .attach('file', PDF, 'zprava.pdf');

    expect(response.status).toBe(409);
    expect(await countFileRecords()).toBe(0);
    expect(files().objects.size).toBe(0);
  });
});
