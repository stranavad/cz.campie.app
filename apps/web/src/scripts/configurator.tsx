import { render } from 'preact';

import { ConfiguratorForm } from '../components/kit/ConfiguratorForm.tsx';
import { templateBySlug } from '../content/kit/documents/index.ts';
import type { DocumentSlug } from '../content/kit/types.ts';

// Mounts the configurator by hand into its place on a template's page, not as an Astro island: an
// island's hydration runs inline scripts, which the Content-Security-Policy forbids. Without this
// script the place stays hidden and the page shows the preset and the blank PDF.
const find = (selector: string) => document.querySelector<HTMLElement>(selector);

const place = find('[data-configurator]');
const section = find('[data-cfg]');
const preview = find('[data-preview]');
const bar = find('[data-preview-bar]');
const tabs = find('[data-cfg-tabs]');
const slug = place?.dataset['configurator'];

if (place && section && preview && bar && tabs && slug !== undefined && slug in templateBySlug) {
  const template = templateBySlug[slug as DocumentSlug];
  if (template.kind === 'template') {
    // The unseen A4 page the live preview is measured in (lib/kit/measure.ts).
    const measurer = document.createElement('div');
    measurer.className = 'kp-stack kp-measure';
    measurer.setAttribute('aria-hidden', 'true');
    document.body.append(measurer);
    const blank = { href: place.dataset['blank'] ?? '', download: place.dataset['download'] ?? '' };
    render(<ConfiguratorForm template={template} places={{ section, preview, measurer, bar, tabs, blank }} />, place);
    place.hidden = false;
    for (const link of document.querySelectorAll<HTMLElement>('[data-configurator-link]')) {
      link.hidden = false;
    }
  }
}
