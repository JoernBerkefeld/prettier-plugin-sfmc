/**
 * Resolves jest from this package or hoisted node_modules (workspace layouts),
 * then runs it with VM modules enabled for ESM tests.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const require = createRequire(join(root, 'package.json'));
let jestPath;
try {
    jestPath = require.resolve('jest/bin/jest', { paths: [root] });
} catch {
    console.error('Could not resolve jest/bin/jest from', root);
    process.exit(1);
}
const result = spawnSync(
    process.execPath,
    ['--experimental-vm-modules', jestPath, ...process.argv.slice(2)],
    { stdio: 'inherit', cwd: root },
);
process.exit(result.status ?? 1);
