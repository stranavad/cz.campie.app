import { weby } from '../content/weby.ts';
import { absoluteHref } from './href.ts';
import { toMarkdown } from './inline.ts';
import { czk } from './weby.ts';

// The Markdown twin of Weby pro tábory (/weby-pro-tabory.md), from the page's own content.
export function webyMarkdown(): string {
  const { hero, steps, gets, price, rules, faq, end } = weby;
  const list = (items: readonly string[]) => items.map((item) => `- ${item}`).join('\n');
  const formLink = `[${price.cta.label}](${absoluteHref(`/weby-pro-tabory${price.cta.href}`)})`;
  const blocks = [
    `# ${hero.title}`,
    hero.lead,
    formLink,
    `## ${steps.title}`,
    steps.items.map((step, index) => `${index + 1}. ${step.text}${step.free ? ` (${steps.free})` : ''}`).join('\n'),
    `## ${gets.title}`,
    ...gets.items.flatMap((item) => [`### ${toMarkdown(item.title)}`, item.text]),
    `## ${price.title}`,
    `**${price.name}:** ${czk(price.oneOff.amount)} ${price.oneOff.label}, ${price.monthly.prefix}${czk(price.monthly.amount)}${price.monthly.suffix} ${price.monthly.label}.`,
    `### ${price.included.title}`,
    list(price.included.items),
    `### ${price.monthlyIncluded.title}`,
    list(price.monthlyIncluded.items),
    `## ${rules.title}`,
    ...rules.items.flatMap((rule) => [`### ${rule.title}`, rule.text]),
    `## ${faq.title}`,
    ...faq.items.flatMap((item) => [`### ${item.question}`, toMarkdown(item.answer)]),
    `## ${end.title}`,
    end.lead,
    formLink,
  ];
  return `${blocks.join('\n\n')}\n`;
}
