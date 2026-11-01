import type { ESTree, Plugin } from '@oxlint/plugins';

interface NoLiteralTextPropsOptions {
  props: string[];
}

function isLiteralText(value: ESTree.JSXAttribute['value']) {
  if (value === null) {
    return false;
  }
  if (value.type === 'Literal') {
    return typeof value.value === 'string' && value.value.trim() !== '';
  }
  if (value.type === 'JSXExpressionContainer') {
    const { expression } = value;
    return (
      (expression.type === 'Literal' && typeof expression.value === 'string') || expression.type === 'TemplateLiteral'
    );
  }
  return false;
}

// `react/jsx-no-literals` checks props all or nothing, which would flag `className`; this checks only
// the props a user reads or hears.
export default {
  meta: { name: 'translations' },
  rules: {
    'no-literal-text-props': {
      meta: {
        type: 'problem',
        docs: { description: 'Disallow literal text in user-facing JSX props.' },
        schema: [
          {
            type: 'object',
            properties: { props: { type: 'array', items: { type: 'string' } } },
            required: ['props'],
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const { props } = context.options[0] as unknown as NoLiteralTextPropsOptions;
        return {
          JSXAttribute(node) {
            if (node.name.type === 'JSXIdentifier' && props.includes(node.name.name) && isLiteralText(node.value)) {
              context.report({ node, message: `Pass \`${node.name.name}\` through t() instead of literal text.` });
            }
          },
        };
      },
    },
  },
} satisfies Plugin;
