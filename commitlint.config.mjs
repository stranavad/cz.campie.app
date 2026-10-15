// Commit message rules, checked by the Husky commit-msg hook. See docs/git.md.

const RELATES_LINE = /^Relates: docs\/issues\/\d{2}-[a-z0-9-]+\.md$/;
const AI_ATTRIBUTION = /co-authored-by|generated (with|by)|\b(claude|anthropic|copilot|chatgpt|openai|gemini)\b/i;

/** Lines after the header, without git's comment lines. */
function bodyLines(raw) {
  return (raw ?? '')
    .split('\n')
    .slice(1)
    .filter((line) => !line.startsWith('#'))
    .map((line) => line.trim())
    .filter(Boolean);
}

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'body-only-relates': ({ raw }) => {
          const invalid = bodyLines(raw).filter((line) => !RELATES_LINE.test(line));
          return [
            invalid.length === 0,
            'no commit body; only "Relates: docs/issues/<NN>-<slug>.md" may follow the subject',
          ];
        },
        // Checks only lines below the subject, so a subject like "add openai integration" is fine.
        'no-ai-attribution': ({ raw }) => [
          !bodyLines(raw).some((line) => AI_ATTRIBUTION.test(line)),
          'no Co-Authored-By lines or mentions of AI tools in commit messages',
        ],
      },
    },
  ],
  rules: {
    'header-max-length': [2, 'always', 72],
    'subject-case': [2, 'always', 'lower-case'],
    'body-only-relates': [2, 'always'],
    'no-ai-attribution': [2, 'always'],
  },
};
