import type { ESTree, Plugin } from '@oxlint/plugins';

interface NoCurrentTimeOptions {
  message: string;
}

function isIdentifier(node: ESTree.Node, name: string) {
  return node.type === 'Identifier' && node.name === name;
}

export default {
  meta: { name: 'time' },
  rules: {
    'no-current-time': {
      meta: {
        type: 'problem',
        docs: { description: 'Disallow reading the current time outside the allowed source.' },
        schema: [
          {
            type: 'object',
            properties: { message: { type: 'string' } },
            required: ['message'],
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const { message } = context.options[0] as unknown as NoCurrentTimeOptions;
        return {
          NewExpression(node) {
            if (isIdentifier(node.callee, 'Date') && node.arguments.length === 0) {
              context.report({ node, message });
            }
          },
          CallExpression(node) {
            const { callee } = node;
            const isDateNow =
              callee.type === 'MemberExpression' &&
              !callee.computed &&
              isIdentifier(callee.object, 'Date') &&
              isIdentifier(callee.property, 'now');
            if (isDateNow) {
              context.report({ node, message });
            }
          },
        };
      },
    },
  },
} satisfies Plugin;
