// PreToolUse hook for Claude Code (.claude/settings.json): blocks agents from reading .env files.
// Only the committed, secret-free .env.example and .env.test are allowed. Exit code 2 blocks the tool
// call and shows the message to the agent.

const ALLOWED = new Set(['.env.example', '.env.test']);

// ".env" or ".env.<anything>" as a path segment, including globs like ".env*".
const ENV_FILE = /(?<![\w.$-])\.env(?![\w-])[\w.*?[\]-]*/g;

function blockedIn(text) {
  return (text ?? '').match(ENV_FILE)?.find((name) => !ALLOWED.has(name));
}

const basename = (path) => path?.split(/[\\/]/).at(-1);

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { tool_name: tool, tool_input: args = {} } = JSON.parse(input);

// What each tool reads: a file path, a search path and glob, or a shell command.
const checked = {
  Read: [basename(args.file_path)],
  Grep: [basename(args.path), args.glob],
  Bash: [args.command],
};

const blocked = checked[tool]?.map(blockedIn).find(Boolean);

if (blocked) {
  console.error(`Reading env files is not allowed (${blocked}). Only .env.example and .env.test may be read.`);
  process.exit(2);
}
