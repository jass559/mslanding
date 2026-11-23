import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const stagingDir = path.join(distDir, '.staging');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runNpm(args: string[]): void {
  const result = spawnSync(npmCommand, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Build command failed with exit code ${result.status ?? 1}.`);
  }
}

function relativeBuildPath(absolutePath: string): string {
  return path.relative(rootDir, absolutePath).replaceAll('\\', '/');
}

function copyPrismaArtifacts(targetDir: string): void {
  const sourceDir = path.join(rootDir, 'prisma');
  const targetPrismaDir = path.join(targetDir, 'prisma');

  mkdirSync(targetPrismaDir, { recursive: true });
  cpSync(path.join(sourceDir, 'schema.prisma'), path.join(targetPrismaDir, 'schema.prisma'));
  cpSync(path.join(sourceDir, 'migrations'), path.join(targetPrismaDir, 'migrations'), {
    recursive: true,
  });
}

function promoteArtifact(name: 'client' | 'server' | 'prisma'): void {
  const stagedPath = path.join(stagingDir, name);
  const publishedPath = path.join(distDir, name);

  rmSync(publishedPath, { recursive: true, force: true });
  renameSync(stagedPath, publishedPath);
}

function main(): void {
  // Remove only an abandoned private staging tree before validating the source.
  // Published dist directories are not touched until every build step succeeds.
  rmSync(stagingDir, { recursive: true, force: true });

  // The content gate is deliberately the first build step that can create
  // production artifacts.
  runNpm(['run', 'verify:content']);

  mkdirSync(stagingDir, { recursive: true });

  try {
    runNpm(['run', 'prisma:generate']);

    const stagedClientDir = path.join(stagingDir, 'client');
    runNpm([
      'exec',
      '--',
      'vite',
      'build',
      '--outDir',
      relativeBuildPath(stagedClientDir),
    ]);

    const stagedServerDir = path.join(stagingDir, 'server');
    runNpm(['exec', '--', 'tsx', 'scripts/buildServer.ts', relativeBuildPath(stagedServerDir)]);

    copyPrismaArtifacts(stagingDir);

    mkdirSync(distDir, { recursive: true });
    promoteArtifact('client');
    promoteArtifact('server');
    promoteArtifact('prisma');
    rmSync(stagingDir, { recursive: true, force: true });

    console.log('Production build artifacts published to dist/.');
  } catch (error) {
    rmSync(stagingDir, { recursive: true, force: true });
    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
