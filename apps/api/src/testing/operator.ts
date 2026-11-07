import { runOperatorCommand } from '../cli/operator-command.ts';
import { createAdmin, signIn, type RequestHeaders } from './fixtures.ts';
import type { useTestApp } from './test-app.ts';
import { enrolTotp } from './totp.ts';

/**
 * Make a new admin the Platform operator through the operator command line and set up their TOTP, as they
 * would at their first login, so their session reaches the console.
 * @param testApp the test app's accessors
 */
export async function createOperator(
  testApp: ReturnType<typeof useTestApp>,
): Promise<{ id: string; email: string; headers: RequestHeaders; secret: Buffer }> {
  const app = testApp.app();
  const admin = await createAdmin(app, { memberOf: [] });
  await runOperatorCommand(testApp.database().ownerUrl, ['grant', admin.email]);
  const { secret, headers } = await enrolTotp(testApp.http(), await signIn(app, admin.id), testApp.clock().now());

  return { id: admin.id, email: admin.email, headers, secret };
}
