import path from 'node:path';
import os from 'node:os';

export const SUPPORTED_PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn'] as const;

export const REGISTRY =
  process.env.PMM_NPM_REGISTRY ?? 'https://registry.npmjs.org';

export const PMM_DIR =
  process.env.PMM_DIR ?? path.resolve(os.homedir(), '.pmm-fallback-dir');

export const PMM_IGNORE_SPEC_MISS_MATCH = /(yes|true|1)/i.test(
  process.env.PMM_IGNORE_SPEC_MISS_MATCH ?? ''
);

export type PackageManagerName = typeof SUPPORTED_PACKAGE_MANAGERS[number];
