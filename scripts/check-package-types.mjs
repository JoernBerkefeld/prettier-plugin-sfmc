import { spawnSync } from 'node:child_process';

const result = spawnSync(
    process.execPath,
    [process.env.npm_execpath, 'pack', '--dry-run', '--json'],
    {
        cwd: new URL('..', import.meta.url),
        encoding: 'utf8',
    },
);

if (result.status !== 0) {
    process.stderr.write(result.stderr || result.error?.message || 'npm pack failed');
    process.exit(result.status ?? 1);
}

const packages = JSON.parse(result.stdout);
const files = packages[0]?.files?.map((file) => file.path) ?? [];

if (!files.includes('src/index.d.ts')) {
    console.error('Published package is missing src/index.d.ts');
    process.exit(1);
}

console.log('Published package includes src/index.d.ts');
