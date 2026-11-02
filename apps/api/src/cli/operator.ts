import { existsSync } from 'node:fs';

import { OperatorCommandError, runOperatorCommand } from './operator-command.ts';

// The operator command line: `pnpm --filter api operator grant <email>`. It connects as the tables'
// owner, like the migrations, since the API's own role cannot write the operator flag. Real env vars win;
// on a developer machine the URL comes from .env.
if (process.env.MIGRATION_DATABASE_URL === undefined && existsSync('.env')) {
  process.loadEnvFile('.env');
}

const ownerUrl = process.env.MIGRATION_DATABASE_URL;

if (ownerUrl === undefined) {
  process.stderr.write('MIGRATION_DATABASE_URL is not set: the command runs as the role that owns the tables.\n');
  process.exit(1);
}

try {
  process.stdout.write(`${await runOperatorCommand(ownerUrl, process.argv.slice(2))}\n`);
} catch (error) {
  if (!(error instanceof OperatorCommandError)) {
    throw error;
  }

  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
