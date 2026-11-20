import {
  czechDay,
  distance,
  fill,
  parseDay,
  shiftDay,
  type DeadlineLabels,
  type Offset,
} from '../lib/kit/deadlines.ts';

// The hub's deadline calculator. The timeline is in the HTML without dates; this shows the date field,
// and for a chosen first day writes each dated step's day and distance and the summary line. The day is
// kept in localStorage; no day is preset.

const STORAGE_KEY = 'campie.kit.start.v1';

function stored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function store(value: string) {
  try {
    if (value === '') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // Storage blocked: the dates still show until the page is left.
  }
}

// Today as a UTC midnight of the local calendar day, comparable with parseDay's days.
function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function setUp(root: HTMLElement) {
  const form = root.querySelector<HTMLElement>('[data-deadline-form]');
  const input = root.querySelector<HTMLInputElement>('[data-deadline-input]');
  const summary = root.querySelector<HTMLElement>('[data-deadline-summary]');
  if (form === null || input === null || summary === null) {
    return;
  }
  const labels = JSON.parse(root.dataset.labels ?? '{}') as DeadlineLabels;
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step][data-offset]')].map((element) => ({
    offset: JSON.parse(element.dataset.offset ?? '{}') as Offset,
    summary: element.dataset.summary ?? null,
    line: element.querySelector<HTMLElement>('[data-step-date]'),
    date: element.querySelector<HTMLElement>('[data-date]'),
    distance: element.querySelector<HTMLElement>('[data-distance]'),
  }));

  const render = () => {
    const start = parseDay(input.value);
    const now = today();
    const sentences = start === null ? [labels.empty] : [fill(labels.start, { date: czechDay(start) })];
    for (const step of steps) {
      const day = start === null ? null : shiftDay(start, step.offset);
      if (step.line !== null) {
        step.line.hidden = day === null;
      }
      if (step.date !== null) {
        step.date.textContent = day === null ? '' : czechDay(day);
      }
      if (step.distance !== null) {
        step.distance.textContent = day === null ? '' : distance(now, day, labels);
      }
      if (day !== null && step.summary !== null) {
        sentences.push(fill(step.summary, { date: czechDay(day) }));
      }
    }
    summary.textContent = sentences.join(' ');
  };

  input.value = stored();
  input.addEventListener('input', () => {
    store(parseDay(input.value) === null ? '' : input.value);
    render();
  });
  form.hidden = false;
  render();
}

for (const root of document.querySelectorAll<HTMLElement>('[data-deadlines]')) {
  setUp(root);
}
