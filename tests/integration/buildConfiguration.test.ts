import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { brandTokens } from '../../tailwind.config';
import { verifyContentFixture } from '../../scripts/contentVerification';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const distPath = path.join(projectRoot, 'dist');
const dockerfilePath = path.join(projectRoot, 'Dockerfile');
const prismaPath = path.join(projectRoot, 'prisma');

interface PackageManifest {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface PackageLock {
  packages?: {
    '': {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
  };
}

function readProjectFile(relativePath: string): string {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function readPackageJson(): PackageManifest {
  return JSON.parse(readProjectFile('package.json')) as PackageManifest;
}

function readPackageLock(): PackageLock {
  return JSON.parse(readProjectFile('package-lock.json')) as PackageLock;
}

function expectDirectory(relativePath: string): void {
  const targetPath = path.join(projectRoot, relativePath);
  expect(existsSync(targetPath), `${relativePath} must exist`).toBe(true);
  expect(statSync(targetPath).isDirectory(), `${relativePath} must be a directory`).toBe(true);
}

function expectFile(relativePath: string): void {
  const targetPath = path.join(projectRoot, relativePath);
  expect(existsSync(targetPath), `${relativePath} must exist`).toBe(true);
  expect(statSync(targetPath).isFile(), `${relativePath} must be a file`).toBe(true);
}

function expectPinnedDependencies(dependencies: Record<string, string>): void {
  for (const [name, version] of Object.entries(dependencies)) {
    expect(
      version,
      `${name} must use an exact semver version instead of a range`,
    ).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  }
}

describe('production build and Docker configuration', () => {
  it('publishes the required frontend and server entry artifacts', () => {
    expectDirectory('dist/client');
    expectFile('dist/server/index.js');
  });

  it('keeps Prisma schema and versioned migrations in the repository', () => {
    expectFile('prisma/schema.prisma');
    expectDirectory('prisma/migrations');

    const migrationDirectories = readdirSync(path.join(prismaPath, 'migrations'), {
      withFileTypes: true,
    }).filter((entry) => entry.isDirectory());

    expect(migrationDirectories.length).toBeGreaterThan(0);
    for (const migration of migrationDirectories) {
      expectFile(path.join('prisma', 'migrations', migration.name, 'migration.sql'));
    }

    const schema = readProjectFile('prisma/schema.prisma');
    expect(schema).toContain('provider = "postgresql"');
    expect(schema).toMatch(/model\s+ContactLead\s*\{/);
    expect(schema).toMatch(/\bid\s+String\s+@id/);
    expect(schema).toMatch(/\bfullName\s+String/);
    expect(schema).toMatch(/\bemail\s+String/);
    expect(schema).toMatch(/\bphone\s+String\?/);
    expect(schema).toMatch(/\bservice\s+String/);
    expect(schema).toMatch(/\bmessage\s+String/);
    expect(schema).toMatch(/\bcreatedAt\s+DateTime/);
    expect(schema).not.toMatch(/\b(name|status|updatedAt)\s+/);
  });

  it('keeps the required deployment environment and brand tokens', () => {
    expectFile('.env.example');
    const envExample = readProjectFile('.env.example');

    expect(envExample).toContain(
      'DATABASE_URL="postgresql://user:password@localhost:5432/multiservicios_db?schema=public"',
    );
    expect(envExample).toContain('PORT=3000');
    expect(envExample).toContain('WHATSAPP_NUMBER="584162459941"');

    expect(brandTokens).toEqual({
      background: '#0A0A0A',
      surface: '#171717',
      'surface-raised': '#1E1E1E',
      border: '#262626',
      accent: '#10B981',
      cta: '#F97316',
      'cta-hover': '#EA580C',
      'text-primary': '#F8FAFC',
      'text-secondary': '#94A3B8',
    });
  });

  it('enforces the required multi-stage Docker runtime contract', () => {
    const dockerfile = readFileSync(dockerfilePath, 'utf8').replaceAll('\r\n', '\n');
    const stages = dockerfile.match(/^FROM\s+\S+(?:\s+AS\s+\S+)?$/gm) ?? [];

    expect(stages.length).toBeGreaterThan(1);
    expect(stages[0]).toBe('FROM node:20-alpine AS base');
    expect(dockerfile).toMatch(/^RUN apk add --no-cache openssl$/m);
    expect(dockerfile).toMatch(/^EXPOSE 3000$/m);
    expect(dockerfile).toContain('COPY --from=build /app/dist ./dist');
    expect(dockerfile).toContain(
      'COPY --from=build /app/prisma/schema.prisma ./prisma/schema.prisma',
    );
    expect(dockerfile).toContain(
      'COPY --from=build /app/prisma/migrations ./prisma/migrations',
    );

    const commandLine = dockerfile
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('CMD '));
    expect(commandLine).toBe(
      'CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/index.js"]',
    );
  });

  it('runs content verification before staging or publishing production artifacts', () => {
    const buildScript = readProjectFile('scripts/build.ts');
    const contentGate = "runNpm(['run', 'verify:content']);";
    const stagingCreation = "mkdirSync(stagingDir, { recursive: true });";
    const clientPromotion = "promoteArtifact('client');";
    const serverPromotion = "promoteArtifact('server');";

    expect(buildScript).toContain(contentGate);
    expect(buildScript.indexOf(contentGate)).toBeGreaterThanOrEqual(0);
    expect(buildScript.indexOf(contentGate)).toBeLessThan(
      buildScript.indexOf(stagingCreation),
    );
    expect(buildScript.indexOf(stagingCreation)).toBeLessThan(
      buildScript.indexOf(clientPromotion),
    );
    expect(buildScript.indexOf(stagingCreation)).toBeLessThan(
      buildScript.indexOf(serverPromotion),
    );

    expect(() =>
      verifyContentFixture({
        rootDir: projectRoot,
        approvedPageCopyAvailable: false,
      }),
    ).toThrow(/approvedPageCopyAvailable must be true/);
  });

  it('keeps direct dependencies exact and synchronized with the lockfile', () => {
    const packageJson = readPackageJson();
    const packageLock = readPackageLock();
    const lockedRoot = packageLock.packages?.[''];

    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.devDependencies).toBeDefined();
    expect(lockedRoot).toBeDefined();

    expectPinnedDependencies(packageJson.dependencies ?? {});
    expectPinnedDependencies(packageJson.devDependencies ?? {});
    expect(lockedRoot?.dependencies).toEqual(packageJson.dependencies);
    expect(lockedRoot?.devDependencies).toEqual(packageJson.devDependencies);
  });
});
