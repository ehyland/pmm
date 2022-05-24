import path from 'node:path';
import os from 'node:os';

export const SUPPORTED_PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn'] as const;

export const REGISTRY =
  process.env.PMM_NPM_REGISTRY ?? 'https://registry.npmjs.org';

export const PMM_DIR =
  process.env.PMM_DIR ?? path.resolve(os.homedir(), '.pmm-fallback-dir');

export type PackageManagerName = typeof SUPPORTED_PACKAGE_MANAGERS[number];
