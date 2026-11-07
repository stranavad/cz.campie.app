import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { OrganisationRepository } from '../../repositories/organisations/organisation/organisation.repository.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { FileService } from '../files/file.service.ts';
import { PdfRenderer } from '../ports/pdf-renderer/pdf-renderer.port.ts';
import type { Letterhead } from './document-layout.tsx';

// A generated document: a component that renders a whole page through DocumentLayout. The letterhead is
// always the pipeline's to give, never the caller's.
export type DocumentTemplate<Props extends object> = (props: Props & { letterhead: Letterhead }) => ReactElement;

// Whose branding a document carries instead of its Organisation's, such as a Camp's; the legal identity
// stays the Organisation's.
export interface DocumentBranding {
  readonly displayName: string;
  readonly accentColour: string;
  readonly logoFileId: string | null;
}

// The one pipeline every generated document goes through: a React template, rendered to static markup with
// the current Organisation's letterhead, then to a PDF. Rendering takes a renderer round trip, so call it
// from a job, never from a request.
@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly files: FileService,
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  /**
   * Render a document of the current Organisation to a PDF.
   * @param template the document's template
   * @param props what the template shows besides the letterhead
   * @param branding a Camp's branding over the Organisation's, if any
   */
  public async render<Props extends object>(
    template: DocumentTemplate<Props>,
    props: Props,
    branding?: DocumentBranding,
  ): Promise<Buffer> {
    const letterhead = await this.letterhead(branding);

    const html = `<!doctype html>${renderToStaticMarkup(createElement(template, { ...props, letterhead }))}`;

    return this.pdfRenderer.render(html);
  }

  /**
   * Render a document of the current Organisation and store the PDF through the file service.
   * @param template the document's template
   * @param props what the template shows besides the letterhead
   * @param name the stored file's name, ending in .pdf
   * @param branding a Camp's branding over the Organisation's, if any
   * @returns the stored file's id, for the record that owns the document
   */
  public async store<Props extends object>(
    template: DocumentTemplate<Props>,
    props: Props,
    name: string,
    branding?: DocumentBranding,
  ): Promise<string> {
    const bytes = await this.render(template, props, branding);

    return this.files.store({ name, bytes });
  }

  /**
   * Load the current Organisation's branding, or the one given, and its legal identity, the logo inlined.
   * @param branding a Camp's branding over the Organisation's, if any
   */
  private async letterhead(branding?: DocumentBranding): Promise<Letterhead> {
    const organisation = await this.organisations.getByIdOrThrow(this.unitOfWork.organisationId);
    const { displayName, accentColour, logoFileId } = branding ?? organisation;

    return {
      displayName,
      accentColour,
      logo: logoFileId === null ? null : await this.logo(logoFileId),
      legalName: organisation.legalName,
      ico: organisation.ico,
      address: organisation.address,
    };
  }

  /**
   * Load the logo as a data URL. A logo file that is gone or no image leaves the documents without a
   * logo rather than failing every one of them.
   * @param fileId the logo's file id
   */
  private async logo(fileId: string): Promise<string | null> {
    const logo = await this.files.read(fileId).catch((error: unknown) => {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    });

    if (logo === null || !logo.contentType.startsWith('image/')) {
      this.logger.warn(`Logo file ${fileId} of Organisation ${this.unitOfWork.organisationId} is missing or no image`);

      return null;
    }

    return `data:${logo.contentType};base64,${logo.bytes.toString('base64')}`;
  }
}
