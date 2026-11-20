import { render, type ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

import { icons, type IconName } from '../../content/icons.ts';
import { documentLabels } from '../../content/kit/documents/index.ts';
import type { DocItem, DocumentTemplate, KitSettings } from '../../content/kit/documents/types.ts';
import { trackEvent } from '../../lib/analytics.ts';
import { href } from '../../lib/href.ts';
import {
  buildDocument,
  emptySettings,
  presetChoices,
  type CustomItem,
  type TemplateChoices,
} from '../../lib/kit/document.ts';
import { czechCount, factView, type FactView } from '../../lib/kit/facts.ts';
import { measureLayout } from '../../lib/kit/measure.ts';
import { fitPdf, FONT, pdfFileName } from '../../lib/kit/pdf.ts';
import { previewHtml } from '../../lib/kit/preview.ts';
import { loadStored, LOGO_PATTERN, saveStored, type Stored } from '../../lib/kit/settings.ts';

// The configurator of a template's page, as the design draws it: three numbered cards (the organiser
// and the camp, the document's items, the download) over a download bar that stays at the bottom of
// the screen. Every change goes to the A4 preview beside it at once and to the browser's storage;
// nothing is sent anywhere. The PDF library is loaded only when a download is asked for.
//
// The preview, its bar and the phone's switch between form and preview stand outside the form in the
// page's HTML (the preview is there without JavaScript); the form renders into them by hand.

const labels = documentLabels.configurator;

const LOGO_MAX = 600;

// The places on the page outside the form.
export interface ConfiguratorPlaces {
  // The section holding form and preview: `data-tab` says which a phone shows.
  section: HTMLElement;
  // The A4 pages, and the unseen page they are measured in (lib/kit/measure.ts).
  preview: HTMLElement;
  measurer: HTMLElement;
  // The line above the preview (what it is, how many pages) and the phone's switch.
  bar: HTMLElement;
  tabs: HTMLElement;
  // The blank PDF, offered when a custom one cannot be made.
  blank: { href: string; download: string };
}

const inputClass =
  'box-border h-11 w-full rounded-xl border-[1.5px] border-line2 bg-card px-3 font-sans text-[16px] text-ink placeholder:text-muted/70 focus:border-ink';
const areaClass =
  'box-border min-h-[84px] w-full resize-y rounded-xl border-[1.5px] border-line2 bg-card px-3 py-2.5 font-sans text-[16px] leading-[1.45] text-ink placeholder:text-muted/70 focus:border-ink';
const fieldLabel = 'text-[13.5px] font-bold text-ink';
const linkButton =
  'inline-flex min-h-8 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-sans text-[14px] font-semibold text-ink underline underline-offset-4 hover:decoration-2';
const smallButton =
  'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-fire bg-fire px-4 font-sans text-[15px] font-bold whitespace-nowrap text-ink-fixed hover:brightness-105';
const ghostButton =
  'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-transparent px-4 font-sans text-[15px] font-bold whitespace-nowrap text-ink';
const subHeading = 'm-0 mt-1 font-mono text-[12px] font-semibold tracking-[0.06em] text-muted uppercase';
const cardClass = 'card flex flex-col gap-3.5 rounded-[22px] px-[22px] pt-5 pb-[22px] phone:p-4';

const pagesWord = (count: number) => czechCount(count, documentLabels.pagesPlural);

function Icon(props: { name: IconName; size?: number; stroke?: number; class?: string }) {
  const size = props.size ?? 18;
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={props.stroke ?? 2.2}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <path d={icons[props.name]} />
    </svg>
  );
}

// The logo, downscaled on the device to LOGO_MAX on its longer side and kept as a JPEG data URL. A PNG
// is turned into a JPEG too: in the browser, pdfmake decodes a PNG in a Web Worker made from a blob URL,
// which the Content-Security-Policy blocks; a JPEG it embeds as it is.
const PAPER = '#ffffff';

async function readLogo(file: File): Promise<string | null> {
  if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
    return null;
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LOGO_MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (context === null) {
    return null;
  }
  // The sheet is white paper, so a transparent PNG loses nothing on a white ground.
  context.fillStyle = PAPER;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const url = canvas.toDataURL('image/jpeg', 0.92);
  return LOGO_PATTERN.test(url) ? url : null;
}

// Anything of the organiser or the camp kept from an earlier visit.
const hasSettings = ({ organiser: { logo, ...texts }, camp }: KitSettings) =>
  logo !== null || [...Object.values(texts), ...Object.values(camp)].some((value) => value.trim() !== '');

// Renders into a place of the page outside the form. The place's static content (the preview's line
// as the build wrote it) is replaced on the first render.
function useOutside(place: HTMLElement, content: ComponentChildren) {
  useLayoutEffect(() => {
    place.textContent = '';
    return () => render(null, place);
  }, [place]);
  useLayoutEffect(() => {
    render(content, place);
  });
}

// The basis mark of a Fact, as BasisBadge.astro draws it in the claim rows.
function BasisMark({ fact }: { fact: FactView }) {
  return (
    <span
      data-basis={fact.basis}
      class="group/kind inline-flex flex-none items-center gap-[7px] font-mono text-[11.5px] leading-[1.2] font-semibold tracking-[0.05em] text-ink uppercase data-[basis=law]:text-muted"
    >
      <i
        aria-hidden="true"
        class="flex size-[18px] flex-none items-center justify-center rounded-[5px] border-[1.5px] border-ink text-[12px] font-bold tracking-normal not-italic group-data-[basis=advice]/kind:rounded-full group-data-[basis=advice]/kind:border-fire-soft group-data-[basis=advice]/kind:bg-fire-soft group-data-[basis=advice]/kind:text-night group-data-[basis=authority]/kind:border-dashed group-data-[basis=law]/kind:border-line2 group-data-[basis=practice]/kind:rounded-full group-data-[basis=practice]/kind:border-dotted"
      >
        {fact.mark}
      </i>
      {fact.basisLabel}
    </span>
  );
}

// Why an item is offered: the reasoning, then its basis and sources in mono.
function Why({ fact }: { fact: FactView }) {
  return (
    <>
      <p class="m-0 text-[14.5px] leading-[1.45] text-muted [&_strong]:text-ink">
        <b class="font-semibold text-ink">{labels.whyItem}</b> <span dangerouslySetInnerHTML={{ __html: fact.html }} />
      </p>
      <p class="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12.5px] leading-[1.45] text-muted">
        <BasisMark fact={fact} />
        <span aria-hidden="true">·</span>
        {fact.citesPrefix !== null && <span>{fact.citesPrefix}</span>}
        {fact.cites.map((cite, index) => (
          <a
            key={cite.href + cite.label}
            href={cite.href}
            rel="noopener"
            target="_blank"
            class="text-muted underline decoration-line2 underline-offset-[3px] hover:text-ink"
          >
            {cite.label}
            {index < fact.cites.length - 1 ? ',' : ''}
          </a>
        ))}
      </p>
    </>
  );
}

function Field(props: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onValue: (value: string) => void;
  full?: boolean;
  mode?: 'numeric' | 'email' | 'tel';
  autoComplete?: string;
}) {
  return (
    <div data-full={props.full === true ? '' : undefined} class="flex flex-col gap-[5px] data-full:col-span-full">
      <label for={props.id} class={fieldLabel}>
        {props.label}
      </label>
      <input
        id={props.id}
        class={inputClass}
        type="text"
        inputMode={props.mode}
        autoComplete={props.autoComplete ?? 'off'}
        placeholder={props.placeholder}
        value={props.value}
        onInput={(event) => props.onValue(event.currentTarget.value)}
      />
    </div>
  );
}

// How the guardian answers an item: two pressed buttons, as the design draws them.
function KindChoice(props: { id: string; kind: CustomItem['kind']; onKind: (kind: CustomItem['kind']) => void }) {
  const options = [
    { kind: 'choice', label: labels.kindChoice },
    { kind: 'statement', label: labels.kindStatement },
  ] as const;
  return (
    <div class="flex flex-col gap-[5px]">
      <span id={props.id} class={fieldLabel}>
        {labels.itemKind}
      </span>
      <div role="group" aria-labelledby={props.id} class="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.kind}
            type="button"
            aria-pressed={props.kind === option.kind}
            class="inline-flex min-h-10 cursor-pointer items-center rounded-full border-[1.5px] border-line2 bg-card px-3.5 font-sans text-[14.5px] font-semibold text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
            onClick={() => props.onKind(option.kind)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// One item of the document: its switch, title, why and the editor of its wording.
interface ItemView {
  id: string;
  title: string;
  text: string;
  on: boolean;
  edited: boolean;
  why: FactView | null;
  // An own item: no switch, a kind to choose, removable.
  own: { kind: CustomItem['kind'] } | null;
}

function ItemCard(props: {
  item: ItemView;
  open: boolean;
  onOpen: (open: boolean) => void;
  onToggle: (on: boolean) => void;
  onChange: (change: { title?: string; text?: string; kind?: CustomItem['kind'] }) => void;
  onRestore: () => void;
  onRemove: () => void;
}) {
  const { item, open } = props;
  const id = `bod-${item.id}`;
  const state = open ? 'open' : item.on ? 'on' : 'off';
  return (
    <li
      data-state={state}
      class="flex flex-col gap-2 rounded-2xl border-[1.5px] border-line2 bg-card px-4 py-3.5 data-[state=off]:border-dashed data-[state=off]:border-line data-[state=off]:bg-transparent data-[state=open]:border-fire-soft data-[state=open]:ring-[3px] data-[state=open]:ring-fire-soft/30"
    >
      <div class="flex items-start gap-3">
        {item.own === null && (
          <button
            type="button"
            role="switch"
            aria-checked={item.on}
            aria-labelledby={`${id}-nazev`}
            class="group mt-px flex h-[26px] w-11 flex-none cursor-pointer rounded-full border-0 bg-toggle p-[3px] aria-checked:bg-ink"
            onClick={() => props.onToggle(!item.on)}
          >
            <span class="size-5 rounded-full bg-card shadow-[0_1px_2px_var(--color-night)] transition-transform group-aria-checked:translate-x-[18px] group-aria-checked:bg-paper motion-reduce:transition-none" />
          </button>
        )}
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <p
            id={`${id}-nazev`}
            class="m-0 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[16.5px] leading-[1.3] font-bold text-ink"
          >
            <span>{item.title.trim() === '' ? labels.customItemTitle : item.title}</span>
            {item.edited && (
              <span class="inline-flex h-[22px] items-center rounded-full border-[1.5px] border-ink px-2 font-mono text-[11px] leading-none font-semibold tracking-[0.03em] uppercase">
                {labels.edited}
              </span>
            )}
            {item.own !== null && (
              <span class="inline-flex h-[22px] items-center rounded-full bg-chip px-2 font-mono text-[11px] leading-none font-semibold tracking-[0.03em] uppercase">
                {labels.own}
              </span>
            )}
          </p>
          {item.why !== null && <Why fact={item.why} />}
          {!open && (
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
              <button
                type="button"
                class={linkButton}
                aria-controls={`${id}-uprava`}
                onClick={() => props.onOpen(true)}
              >
                {labels.editItem}
              </button>
              {item.own !== null && (
                <button type="button" class={linkButton} onClick={props.onRemove}>
                  {labels.removeItem}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {open && (
        <div id={`${id}-uprava`} class="flex flex-col gap-2.5 rounded-xl bg-chip p-3">
          <div class="flex flex-col gap-[5px]">
            <label for={`${id}-titulek`} class={fieldLabel}>
              {labels.itemTitle}
            </label>
            <input
              id={`${id}-titulek`}
              class={inputClass}
              value={item.title}
              onInput={(event) => props.onChange({ title: event.currentTarget.value })}
            />
          </div>
          <div class="flex flex-col gap-[5px]">
            <label for={`${id}-text`} class={fieldLabel}>
              {labels.itemText}
            </label>
            <textarea
              id={`${id}-text`}
              class={areaClass}
              rows={4}
              value={item.text}
              onInput={(event) => props.onChange({ text: event.currentTarget.value })}
            />
          </div>
          {item.own !== null && (
            <KindChoice id={`${id}-druh`} kind={item.own.kind} onKind={(kind) => props.onChange({ kind })} />
          )}
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="button" class={smallButton} onClick={() => props.onOpen(false)}>
              {labels.doneItem}
            </button>
            {item.edited && (
              <button type="button" class={linkButton} onClick={props.onRestore}>
                {labels.restoreItem}
              </button>
            )}
            {item.own !== null && (
              <button type="button" class={linkButton} onClick={props.onRemove}>
                {labels.removeItem}
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

// The phone's switch between the form and the preview, sticky at the top of the section.
function Tabs(props: { tab: Tab; pages: number; onTab: (tab: Tab) => void }) {
  const options = [
    { tab: 'form', label: labels.showForm },
    { tab: 'preview', label: `${labels.showPreview} · ${pagesWord(props.pages)}` },
  ] as const;
  return (
    <div class="border-b border-line bg-paper px-5 py-2">
      <div role="group" aria-label={labels.show} class="flex rounded-full bg-chip p-1">
        {options.map((option) => (
          <button
            key={option.tab}
            type="button"
            aria-pressed={props.tab === option.tab}
            class="min-h-10 flex-1 cursor-pointer rounded-full border-0 bg-transparent font-sans text-[15px] font-bold text-ink aria-pressed:bg-ink aria-pressed:text-paper"
            onClick={() => props.onTab(option.tab)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// The line above the preview: what it shows, how many pages, and, when the document runs on, what
// brings it back to one page.
function PreviewBar(props: { pages: number }) {
  return (
    <>
      <div class="flex items-center justify-between gap-2.5">
        <span class="font-mono text-[12.5px] font-semibold tracking-[0.06em] text-muted uppercase">
          {documentLabels.previewLabel}
        </span>
        <span class="font-mono text-[12.5px] text-muted">
          {pagesWord(props.pages)} {documentLabels.a4}
        </span>
      </div>
      {props.pages > 1 && (
        <p
          role="status"
          class="m-0 flex items-start gap-2.5 rounded-xl border-[1.5px] border-peachline bg-peach px-3.5 py-2.5 text-[14.5px] leading-[1.45] text-ink"
        >
          <Icon name="alert" class="mt-0.5 flex-none" />
          <span>{labels.morePages.replace('{strany}', pagesWord(props.pages))}</span>
        </p>
      )}
    </>
  );
}

type Status = 'idle' | 'generating' | 'failed' | 'done';
type Tab = 'form' | 'preview';

export function ConfiguratorForm(props: { template: DocumentTemplate; places: ConfiguratorPlaces }) {
  const { template, places } = props;
  const [stored, setStored] = useState<Stored>(loadStored);
  // "návrat": the organiser's data were found in this browser when the page opened.
  const [returning, setReturning] = useState(() => hasSettings(stored.settings));
  const [status, setStatus] = useState<Status>('idle');
  const [saved, setSaved] = useState('');
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<CustomItem, 'id'> | null>(null);
  const [tab, setTab] = useState<Tab>('form');
  const [pages, setPages] = useState(1);
  const { settings } = stored;
  const choices = stored.templates[template.slug] ?? presetChoices(template);

  // The fonts change the measures: the pages are laid out again once they have loaded.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    void document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    saveStored(stored);
    const doc = buildDocument(template, stored.settings, choices);
    const layout = measureLayout(doc, places.measurer);
    places.preview.innerHTML = previewHtml(doc, layout);
    setPages(layout.pages);
  }, [stored, fontsReady]);

  useEffect(() => {
    places.section.dataset['tab'] = tab;
  }, [tab]);

  // After a download the bridge to Campie opens above the download bar, in view.
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status === 'done') {
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      doneRef.current?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    }
  }, [status]);

  // A phone shows the form or the preview; the one chosen starts under the sticky switch.
  const formRef = useRef<HTMLFormElement>(null);
  const showTab = (next: Tab) => {
    setTab(next);
    requestAnimationFrame(() => {
      const target = next === 'preview' ? places.bar : formRef.current;
      if (target === null) {
        return;
      }
      const top = target.getBoundingClientRect().top - places.tabs.getBoundingClientRect().height - 12;
      if (top < 0) {
        window.scrollBy(0, top);
      }
    });
  };
  useOutside(places.tabs, <Tabs tab={tab} pages={pages} onTab={showTab} />);
  useOutside(places.bar, <PreviewBar pages={pages} />);

  // Every change is made to the latest state, so changes made in one go (a click that toggles, a
  // logo read while typing) never undo each other.
  const setSettings = (change: (prev: KitSettings) => KitSettings) =>
    setStored((prev) => ({ ...prev, settings: change(prev.settings) }));
  const setOrganiser = (field: keyof Omit<KitSettings['organiser'], 'logo'>) => (value: string) =>
    setSettings((prev) => ({ ...prev, organiser: { ...prev.organiser, [field]: value } }));
  const setCamp = (field: keyof KitSettings['camp']) => (value: string) =>
    setSettings((prev) => ({ ...prev, camp: { ...prev.camp, [field]: value } }));
  const setLogo = (logo: string | null) => setSettings((prev) => ({ ...prev, organiser: { ...prev.organiser, logo } }));
  const setChoices = (change: (prev: TemplateChoices) => TemplateChoices) =>
    setStored((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [template.slug]: change(prev.templates[template.slug] ?? presetChoices(template)),
      },
    }));

  const toggle = (id: string, on: boolean) =>
    setChoices((prev) => {
      const rest = prev.on.filter((item) => item !== id);
      return { ...prev, on: on ? [...rest, id] : rest };
    });
  const edit = (item: DocItem, change: { title?: string; text?: string } | undefined) =>
    setChoices((prev) => {
      const { [item.id]: old, ...rest } = prev.edits;
      const next = { title: old?.title ?? item.title, text: old?.text ?? item.text, ...change };
      return { ...prev, edits: change === undefined ? rest : { ...rest, [item.id]: next } };
    });
  const changeItem = (id: string, change: Partial<Omit<CustomItem, 'id'>>) =>
    setChoices((prev) => ({
      ...prev,
      custom: prev.custom.map((item) => (item.id === id ? { ...item, ...change } : item)),
    }));
  const removeItem = (id: string) => {
    setOpen(null);
    setChoices((prev) => ({ ...prev, custom: prev.custom.filter((item) => item.id !== id) }));
  };
  const addItem = (item: Omit<CustomItem, 'id'>) => {
    setChoices((prev) => ({
      ...prev,
      custom: [
        ...prev.custom,
        { ...item, id: `vlastni-${Date.now().toString(36)}`, title: item.title.trim() || labels.customItemTitle },
      ],
    }));
    setDraft(null);
  };
  const reset = () => {
    setOpen(null);
    setStored((prev) => {
      const { [template.slug]: _old, ...rest } = prev.templates;
      return { ...prev, templates: rest };
    });
  };
  const clearSettings = () => {
    setReturning(false);
    setLogoName(null);
    setStored((prev) => ({ ...prev, settings: emptySettings }));
  };

  const chooseLogo = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = '';
    if (file === undefined) {
      return;
    }
    const logo = await readLogo(file).catch(() => null);
    setLogoError(logo === null ? file.name : null);
    if (logo !== null) {
      setLogoName(file.name);
      setLogo(logo);
    }
  };

  const download = async () => {
    setStatus('generating');
    try {
      const doc = buildDocument(template, settings, choices);
      const { pdfBlob, saveBlob } = await import('../../lib/kit/pdf-browser.ts');
      const { output } = await fitPdf(doc, (definition) => pdfBlob(definition, FONT));
      const name = pdfFileName(doc);
      saveBlob(output, name);
      trackEvent('kit-download', { template: template.slug, variant: 'custom' });
      setSaved(name);
      setStatus('done');
    } catch {
      setStatus('failed');
    }
  };

  const itemViews = template.items.map((item) => {
    const edited = choices.edits[item.id];
    return {
      item,
      view: {
        id: item.id,
        title: edited?.title ?? item.title,
        text: edited?.text ?? item.text,
        on: choices.on.includes(item.id),
        edited: edited !== undefined && (edited.title !== item.title || edited.text !== item.text),
        why: factView(item.why),
        own: null,
      } satisfies ItemView,
    };
  });
  const card = (entry: (typeof itemViews)[number]) => (
    <ItemCard
      key={entry.item.id}
      item={entry.view}
      open={open === entry.item.id}
      onOpen={(next) => setOpen(next ? entry.item.id : null)}
      onToggle={(on) => toggle(entry.item.id, on)}
      onChange={(change) => edit(entry.item, change)}
      onRestore={() => edit(entry.item, undefined)}
      onRemove={() => undefined}
    />
  );
  const itemsOn = itemViews.filter((entry) => entry.view.on);
  const itemsOff = itemViews.filter((entry) => !entry.view.on);
  const onCount = itemsOn.length + choices.custom.length;
  const organiser = settings.organiser;
  const placeholders = labels.placeholders;

  return (
    <form ref={formRef} class="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      {returning && (
        <div
          role="status"
          class="flex items-start gap-3.5 rounded-2xl border-[1.5px] border-ink bg-card px-4 py-3.5 text-ink"
        >
          <span
            aria-hidden="true"
            class="flex size-7 flex-none items-center justify-center rounded-full bg-ink text-paper"
          >
            <Icon name="undo" size={16} stroke={2.6} />
          </span>
          <div class="flex flex-col gap-1">
            <p class="m-0 text-[15px] leading-[1.45]">
              <strong>{labels.returning.title}</strong> {labels.returning.text}
            </p>
            <div class="flex flex-wrap gap-x-4 gap-y-1">
              <button type="button" class={linkButton} onClick={() => setReturning(false)}>
                {labels.returning.keep}
              </button>
              <button type="button" class={linkButton} onClick={clearSettings}>
                {labels.returning.clear}
              </button>
            </div>
          </div>
        </div>
      )}

      <fieldset class={`${cardClass} m-0 min-w-0`}>
        <legend class="sr-only">{labels.organiser}</legend>
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h3 class="h-card m-0 flex items-center gap-2.5 text-[22px] tracking-[-0.025em]">
            <span class="inline-flex size-7 flex-none items-center justify-center rounded-full bg-ink font-mono text-[14px] font-semibold tracking-normal text-paper">
              1
            </span>
            {labels.organiser}
          </h3>
          <span class="text-[14px] text-muted">{labels.optional}</span>
        </div>
        <p class="m-0 -mt-1.5 text-[14px] text-muted">{labels.organiserHint}</p>
        <div class="flex items-center gap-3.5 rounded-[14px] border-[1.5px] border-dashed border-line2 p-2.5">
          <div class="flex size-14 flex-none items-center justify-center overflow-hidden rounded-xl bg-chip text-muted">
            {organiser.logo === null ? (
              <Icon name="image" size={24} stroke={2} />
            ) : (
              <img src={organiser.logo} alt="" class="size-full bg-sheet object-contain p-1" />
            )}
          </div>
          <div class="min-w-0 flex-1 text-[14px] text-muted">
            <strong class="block truncate text-[15px] text-ink">
              {organiser.logo === null ? labels.logo : (logoName ?? labels.logoSet)}
            </strong>
            {organiser.logo === null && labels.logoHint}
          </div>
          {organiser.logo === null ? (
            <label
              class={`${ghostButton} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fire`}
            >
              {labels.uploadLogo}
              <input
                type="file"
                accept="image/png,image/jpeg"
                class="sr-only"
                onChange={(event) => void chooseLogo(event.currentTarget)}
              />
            </label>
          ) : (
            <button
              type="button"
              class={linkButton}
              onClick={() => {
                setLogoName(null);
                setLogo(null);
              }}
            >
              {labels.removeLogo}
            </button>
          )}
        </div>
        {logoError !== null && (
          <p role="alert" class="m-0 flex items-start gap-2 text-[14px] font-semibold text-err">
            <Icon name="alert" class="mt-px flex-none" />
            {labels.logoInvalid.replace('{soubor}', logoError)}
          </p>
        )}
        <div class="grid grid-cols-2 gap-x-3.5 gap-y-3 phone:grid-cols-1">
          <Field
            id="k-nazev"
            full
            label={labels.organiserName}
            placeholder={placeholders.name}
            autoComplete="organization"
            value={organiser.name}
            onValue={setOrganiser('name')}
          />
          <Field
            id="k-ico"
            label={labels.ico}
            placeholder={placeholders.ico}
            mode="numeric"
            value={organiser.ico}
            onValue={setOrganiser('ico')}
          />
          <Field
            id="k-sidlo"
            label={labels.address}
            placeholder={placeholders.address}
            value={organiser.address}
            onValue={setOrganiser('address')}
          />
          <Field
            id="k-email"
            mode="email"
            label={labels.email}
            placeholder={placeholders.email}
            autoComplete="email"
            value={organiser.email}
            onValue={setOrganiser('email')}
          />
          <Field
            id="k-telefon"
            mode="tel"
            label={labels.phone}
            placeholder={placeholders.phone}
            autoComplete="tel"
            value={organiser.phone}
            onValue={setOrganiser('phone')}
          />
        </div>
        <p class={subHeading}>{labels.camp}</p>
        <div class="grid grid-cols-2 gap-x-3.5 gap-y-3 phone:grid-cols-1">
          <Field
            id="k-tabor"
            full
            label={labels.campName}
            placeholder={placeholders.campName}
            value={settings.camp.name}
            onValue={setCamp('name')}
          />
          <Field
            id="k-termin"
            label={labels.term}
            placeholder={placeholders.term}
            value={settings.camp.term}
            onValue={setCamp('term')}
          />
          <Field
            id="k-misto"
            label={labels.place}
            placeholder={placeholders.place}
            value={settings.camp.place}
            onValue={setCamp('place')}
          />
        </div>
      </fieldset>

      <fieldset class={`${cardClass} m-0 min-w-0`}>
        <legend class="sr-only">{labels.items}</legend>
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h3 class="h-card m-0 flex items-center gap-2.5 text-[22px] tracking-[-0.025em]">
            <span class="inline-flex size-7 flex-none items-center justify-center rounded-full bg-ink font-mono text-[14px] font-semibold tracking-normal text-paper">
              2
            </span>
            {labels.items}
          </h3>
          <button type="button" class={linkButton} onClick={reset}>
            {labels.reset}
          </button>
        </div>
        <p class="m-0 flex items-center gap-2.5 rounded-xl bg-chip px-3.5 py-2.5 text-[14.5px] leading-[1.45] text-muted">
          <Icon name="lock" class="flex-none" />
          <span>{labels.fixedNote}</span>
        </p>
        <p class={subHeading}>
          {labels.itemsOn} · {onCount}
        </p>
        <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
          {itemsOn.map(card)}
          {choices.custom.map((item) => (
            <ItemCard
              key={item.id}
              item={{ id: item.id, title: item.title, text: item.text, on: true, edited: false, why: null, own: item }}
              open={open === item.id}
              onOpen={(next) => setOpen(next ? item.id : null)}
              onToggle={() => undefined}
              onChange={(change) => changeItem(item.id, change)}
              onRestore={() => undefined}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </ul>
        {itemsOff.length > 0 && (
          <>
            <p class={subHeading}>
              {labels.itemsOff} · {itemsOff.length}
            </p>
            <ul class="m-0 flex list-none flex-col gap-2.5 p-0">{itemsOff.map(card)}</ul>
          </>
        )}
        {draft === null ? (
          <button
            type="button"
            class="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line2 bg-transparent font-sans text-[16px] font-bold text-ink hover:border-ink"
            onClick={() => setDraft({ title: '', text: '', kind: 'choice' })}
          >
            <Icon name="plus" stroke={2.4} />
            {labels.addItem}
          </button>
        ) : (
          <div class="flex flex-col gap-2.5 rounded-xl border-[1.5px] border-ink bg-card p-3">
            <p class="m-0 font-bold text-ink">{labels.customItemTitle}</p>
            <div class="flex flex-col gap-[5px]">
              <label for="k-novy-nadpis" class={fieldLabel}>
                {labels.newTitle}
              </label>
              <input
                id="k-novy-nadpis"
                class={inputClass}
                placeholder={labels.newTitlePlaceholder}
                value={draft.title}
                onInput={(event) => {
                  const title = event.currentTarget.value;
                  setDraft((prev) => prev && { ...prev, title });
                }}
              />
            </div>
            <div class="flex flex-col gap-[5px]">
              <label for="k-novy-text" class={fieldLabel}>
                {labels.newText}
              </label>
              <textarea
                id="k-novy-text"
                class={areaClass}
                rows={3}
                placeholder={labels.newTextPlaceholder}
                value={draft.text}
                onInput={(event) => {
                  const text = event.currentTarget.value;
                  setDraft((prev) => prev && { ...prev, text });
                }}
              />
            </div>
            <KindChoice
              id="k-novy-druh"
              kind={draft.kind}
              onKind={(kind) => setDraft((prev) => prev && { ...prev, kind })}
            />
            <div class="flex flex-wrap items-center gap-3">
              <button type="button" class={smallButton} onClick={() => addItem(draft)}>
                {labels.addToDocument}
              </button>
              <button type="button" class={linkButton} onClick={() => setDraft(null)}>
                {labels.cancel}
              </button>
            </div>
          </div>
        )}
      </fieldset>

      <fieldset class={`${cardClass} m-0 min-w-0`}>
        <legend class="sr-only">{labels.download}</legend>
        <h3 class="h-card m-0 flex items-center gap-2.5 text-[22px] tracking-[-0.025em]">
          <span class="inline-flex size-7 flex-none items-center justify-center rounded-full bg-ink font-mono text-[14px] font-semibold tracking-normal text-paper">
            3
          </span>
          {labels.download}
        </h3>
        <label class="flex cursor-pointer items-start gap-2.5 text-[15px] text-ink">
          <input
            type="checkbox"
            class="mt-0.5 size-5 flex-none accent-ink"
            checked={choices.credit}
            onChange={(event) => {
              const credit = event.currentTarget.checked;
              setChoices((prev) => ({ ...prev, credit }));
            }}
          />
          <span>
            {labels.credit}
            <small class="block text-[14px] text-muted">{labels.creditHint}</small>
          </span>
        </label>
      </fieldset>

      {status === 'done' && (
        <div
          ref={doneRef}
          role="status"
          class="flex scroll-mb-40 flex-col gap-3 rounded-[20px] border-[1.5px] border-ink bg-card px-[22px] py-5"
        >
          <p class="m-0 flex items-center gap-2.5 font-bold [overflow-wrap:anywhere] text-ink">
            <span
              aria-hidden="true"
              class="flex size-7 flex-none items-center justify-center rounded-full bg-ink text-paper"
            >
              <Icon name="tick" size={16} stroke={3} />
            </span>
            {labels.downloaded} {saved}
          </p>
          <div class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-2xl bg-forest p-4 text-cream">
            <span
              aria-hidden="true"
              class="row-span-3 flex size-12 items-center justify-center rounded-[14px] bg-cream/10 text-fire-soft"
            >
              <Icon name="phoneCheck" size={26} stroke={2} />
            </span>
            <h4 class="h-card m-0 text-[21px] tracking-[-0.02em]">{documentLabels.afterDownload.title}</h4>
            <p class="m-0 text-[15px] text-sage">{template.inCampie}</p>
            <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <a href={href(documentLabels.afterDownload.cta.href)} class={`${smallButton} no-underline`}>
                {documentLabels.afterDownload.cta.label}
              </a>
              <button type="button" class={`${linkButton} text-sage`} onClick={() => setStatus('idle')}>
                {labels.close}
              </button>
            </div>
          </div>
        </div>
      )}

      <div class="sticky bottom-0 z-[5] flex flex-col gap-2.5 rounded-[20px] bg-forest px-[22px] py-[18px] text-cream shadow-[0_-10px_30px_-18px_var(--color-night)] phone:px-4">
        <button
          type="button"
          class="absolute right-0 bottom-full mb-3 flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-0 bg-ink py-0 pr-4 pl-2.5 font-sans font-bold text-paper shadow-[0_8px_20px_-8px_var(--color-night)] xl:hidden"
          onClick={() => showTab('preview')}
        >
          <span aria-hidden="true" class="h-9 w-7 rounded-[3px] border border-line2 bg-sheet" />
          {labels.showPreview}
        </button>
        {status === 'failed' && (
          <p
            role="alert"
            class="m-0 flex items-start gap-2.5 rounded-xl bg-errbg px-3 py-2.5 text-[14.5px] font-semibold text-err"
          >
            <Icon name="alert" class="mt-0.5 flex-none" />
            <span>
              {labels.failed}{' '}
              <a href={places.blank.href} download={places.blank.download} class="text-err underline">
                {documentLabels.downloadBlank}
              </a>
            </span>
          </p>
        )}
        <div class="flex flex-wrap items-center gap-x-[18px] gap-y-2.5">
          <button
            type="button"
            class="btn min-w-[220px] cursor-pointer justify-center gap-2.5 hover:brightness-105 disabled:cursor-wait phone:w-full"
            disabled={status === 'generating'}
            aria-busy={status === 'generating'}
            onClick={() => void download()}
          >
            {status === 'generating' ? (
              <>
                <span
                  aria-hidden="true"
                  class="size-[18px] animate-spin rounded-full border-[2.5px] border-ink-fixed/30 border-t-ink-fixed motion-reduce:animate-none"
                />
                {labels.generating}
              </>
            ) : (
              <>
                <Icon name="download" stroke={2.4} />
                {status === 'failed' ? labels.retry : documentLabels.downloadCustom}
              </>
            )}
          </button>
          <small aria-live="polite" class="flex-1 basis-48 text-[13.5px] text-sage">
            {status === 'generating' ? labels.generatingHint : `${pagesWord(pages)} ${documentLabels.a4}`}
          </small>
        </div>
      </div>
    </form>
  );
}
