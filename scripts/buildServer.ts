import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const outputDir = path.resolve(rootDir, process.argv[2] ?? 'dist/server');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const result = spawnSync(
  npmCommand,
  [
    'exec',
    '--',
    'tsc',
    '-p',
    path.join(rootDir, 'tsconfig.server.json'),
    '--outDir',
    outputDir,
  ],
  {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

writeFileSync(
  path.join(outputDir, 'index.js'),
  `'use strict';\n\nconst { startServer } = require('./server/src/index.js');\n\nvoid startServer().catch((error) => {\n  console.error(error instanceof Error ? error.message : 'Unable to start the unified server.');\n  process.exitCode = 1;\n});\n`,
  'utf8',
);
