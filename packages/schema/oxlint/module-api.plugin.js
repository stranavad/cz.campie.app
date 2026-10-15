import { dirname, resolve } from 'node:path';

function locate(path) {
  const match = path.replaceAll('\\', '/').match(/\/packages\/schema\/src\/(.+)$/);
  if (!match) {
    return null;
  }
  const [module, ...rest] = match[1].split('/');
  return { module, rest };
}

function importProblem(filename, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const source = locate(filename);
  const target = locate(resolve(dirname(filename), specifier));
  if (!source || !target) {
    return null;
  }

  const isEntry = target.rest.length === 1 && target.rest[0] === 'index.ts';
  if (source.module === target.module) {
    return isEntry ? `Inside ${target.module}/, import files directly, not its own index.ts.` : null;
  }
  if (source.module === 'shared') {
    return 'shared/ holds building blocks for every module; it must not import one.';
  }
  return isEntry
    ? null
    : `Import ${target.module}/ only through ${target.module}/index.ts; its other files are private.`;
}

export default {
  meta: { name: 'schema' },
  rules: {
    'module-api': {
      meta: {
        type: 'problem',
        docs: { description: 'A module imports another only through its index.ts; shared/ imports none.' },
      },
      create(context) {
        function check(source) {
          if (source?.type !== 'Literal' || typeof source.value !== 'string') {
            return;
          }
          const message = importProblem(context.filename, source.value);
          if (message) {
            context.report({ node: source, message });
          }
        }

        return {
          ImportDeclaration: (node) => check(node.source),
          ExportNamedDeclaration: (node) => check(node.source),
          ExportAllDeclaration: (node) => check(node.source),
          ImportExpression: (node) => check(node.source),
        };
      },
    },
  },
};
