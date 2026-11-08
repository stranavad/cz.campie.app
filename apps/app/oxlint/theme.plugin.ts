import type { ESTree, Plugin } from '@oxlint/plugins';

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const UTILITY =
  'bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|decoration|shadow|accent|caret';
// A Tailwind palette colour (`bg-stone-100`, `text-white`), or an arbitrary hex colour (`bg-[#fff]`). A black
// overlay with opacity (`bg-black/40`) stays allowed: it darkens whatever theme is under it.
const RAW_COLOUR = new RegExp(
  `(?:^|[\\s:])(?:${UTILITY})-(?:(?:${PALETTE})-\\d{2,3}|white|black(?!\\/))(?=$|[\\s/])|-\\[#[0-9a-fA-F]{3,8}\\]`,
);

// Input types that open the browser's own picker, which looks different on every device and ignores the
// theme. File inputs are allowed only inside the shared file components.
const NATIVE_PICKER_TYPES = new Set(['date', 'datetime-local', 'time', 'month', 'week', 'color', 'file']);

// Raw colours break the dark theme and Organisation branding; every colour goes through a theme token.
export default {
  meta: { name: 'theme' },
  rules: {
    'no-native-pickers': {
      meta: {
        type: 'problem',
        docs: { description: "Disallow <select> and inputs that open the browser's own picker." },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.type === 'JSXIdentifier' && node.name.name === 'select') {
              context.report({
                node,
                message: 'Use `Select` from `@/components/ui/select` instead of a native <select>.',
              });
            }
          },
          JSXAttribute(node) {
            if (
              node.name.type === 'JSXIdentifier' &&
              node.name.name === 'type' &&
              node.value?.type === 'Literal' &&
              typeof node.value.value === 'string' &&
              NATIVE_PICKER_TYPES.has(node.value.value)
            ) {
              context.report({
                node,
                message: `\`type="${node.value.value}"\` opens the browser's own picker: use DatePicker, DateTimePicker, AccentPicker, FileInput or FileButton.`,
              });
            }
          },
        };
      },
    },
    'no-raw-colours': {
      meta: {
        type: 'problem',
        docs: { description: 'Disallow Tailwind palette and hex colours in class strings.' },
        schema: [],
      },
      create(context) {
        const report = (node: ESTree.Node, text: string) => {
          const match = RAW_COLOUR.exec(text);

          if (match !== null) {
            context.report({
              node,
              message: `\`${match[0].trim()}\` is a raw colour: use a theme token (bg-card, text-muted-foreground, bg-brand, ...) so both themes and every accent work.`,
            });
          }
        };

        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              report(node, node.value);
            }
          },
          TemplateElement(node) {
            report(node, node.value.raw);
          },
        };
      },
    },
  },
} satisfies Plugin;
