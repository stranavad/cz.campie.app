import { Injectable } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { OrganisationRepository } from '../../repositories/organisations/organisation/organisation.repository.ts';
import { brandOrganisation, createOrganisation } from '../../testing/fixtures.ts';
import { SampleDocument } from '../../testing/sample-document.tsx';
import { useTestApp } from '../../testing/test-app.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { FileService } from '../files/file.service.ts';
import { JobQueue } from '../jobs/job-queue.ts';
import { defineJob, JobHandler } from '../jobs/job.ts';
import { DocumentService } from './document.service.ts';

// Stands in for the features that will generate their documents in a job: renders the sample and keeps
// the stored file's id, as a feature would on its own record.
const sampleDocumentJob = defineJob({ name: 'test.sample-document', scope: 'organisation', payload: z.object({}) });

@Injectable()
class SampleDocumentHandler extends JobHandler<typeof sampleDocumentJob> {
  public readonly job = sampleDocumentJob;
  public readonly stored: string[] = [];

  constructor(private readonly documents: DocumentService) {
    super();
  }

  public async handle(): Promise<void> {
    this.stored.push(
      await this.documents.store(SampleDocument, { campName: 'Letní tábor Pokus', turnus: '1. turnus' }, 'ukazka.pdf'),
    );
  }
}

// An obviously fake logo: the bytes a PNG is recognised by, plus a marker.
const LOGO = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('fake logo')]);

describe('documents', () => {
  const { app, http, pdfs, jobs } = useTestApp({ providers: [SampleDocumentHandler] });

  const requestSampleDocument = (organisationId: string) =>
    app()
      .get(UnitOfWork)
      .run(organisationId, async () => app().get(JobQueue).enqueue(sampleDocumentJob, {}));

  const renderSampleDocument = async (organisationId: string): Promise<string> => {
    await requestSampleDocument(organisationId);
    await jobs().drain();

    return pdfs().rendered.at(-1) ?? '';
  };

  it("renders a document in a job with its Organisation's branding and legal identity, and stores it encrypted", async () => {
    const organisation = await createOrganisation(app(), {
      legalName: 'Spolek Testovací tábor z. s.',
      ico: '12345678',
      address: 'Smyšlená 1, 123 45 Testov',
      displayName: 'Tábor Pokus',
      accentColour: '#2a6f4e',
    });
    await createOrganisation(app(), { legalName: 'Jiný testovací spolek' });

    await requestSampleDocument(organisation);

    expect(pdfs().rendered).toEqual([]);

    await jobs().drain();

    expect(pdfs().rendered).toHaveLength(1);
    const html = pdfs().rendered[0];
    expect(html).toContain('Spolek Testovací tábor z. s.');
    expect(html).toContain('IČO 12345678');
    expect(html).toContain('Smyšlená 1, 123 45 Testov');
    expect(html).toContain('Tábor Pokus');
    expect(html).toContain('#2a6f4e');
    expect(html).toContain('Letní tábor Pokus');
    expect(html).not.toContain('Jiný testovací spolek');

    const [fileId] = app().get(SampleDocumentHandler).stored;
    const link = await app()
      .get(UnitOfWork)
      .run(organisation, () =>
        app()
          .get(FileService)
          .link(fileId ?? ''),
      );
    const download = await http().get(link.url).buffer(true);
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toBe('application/pdf');
    expect(download.body.toString()).toMatch(/^%PDF-/);
  });

  it("changes the rendered document with the Organisation's logo, colour and legal name", async () => {
    const organisation = await createOrganisation(app(), {
      legalName: 'Spolek Původní z. s.',
      accentColour: '#2a6f4e',
    });
    const before = await renderSampleDocument(organisation);

    await brandOrganisation(app(), organisation, {
      legalName: 'Spolek Přejmenovaný z. s.',
      accentColour: '#8a1c7c',
      logo: LOGO,
    });
    const after = await renderSampleDocument(organisation);

    expect(before).toContain('Spolek Původní z. s.');
    expect(before).toContain('#2a6f4e');
    expect(before).not.toContain('<img');
    expect(after).not.toContain('Spolek Původní z. s.');
    expect(after).toContain('Spolek Přejmenovaný z. s.');
    expect(after).not.toContain('#2a6f4e');
    expect(after).toContain('#8a1c7c');
    expect(after).toContain(`src="data:image/png;base64,${LOGO.toString('base64')}"`);
  });

  it('renders without the logo when its file is gone, instead of failing every document', async () => {
    const organisation = await createOrganisation(app(), { legalName: 'Spolek Bez loga z. s.' });
    await brandOrganisation(app(), organisation, { logo: LOGO });
    // Removed past the Organisation, which nothing in the app does, but nothing in the database prevents.
    await app()
      .get(UnitOfWork)
      .run(organisation, async () => {
        const { logoFileId } = await app().get(OrganisationRepository).getByIdOrThrow(organisation);
        await app()
          .get(FileService)
          .remove(logoFileId ?? '');
      });

    const html = await renderSampleDocument(organisation);

    expect(html).toContain('Spolek Bez loga z. s.');
    expect(html).not.toContain('<img');
  });

  it('refuses an accent colour that is not a hex colour, so it cannot carry CSS into a document', async () => {
    await expect(
      createOrganisation(app(), { accentColour: 'red;background:url(http://example.test/)' }),
    ).rejects.toMatchObject({ cause: { constraint: 'organisations_accent_colour_hex' } });
  });
});
