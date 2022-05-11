import path from 'node:path';
import os from 'node:os';

export const SUPPORTED_PACKAGE_MANAGERS = ['pnpm', 'npm'] as const;

export const REGISTRY =
  process.env.PMM_NPM_REGISTRY ?? 'https://registry.npmjs.org';

export const PMM_DIR =
  process.env.PMM_DIR ?? path.resolve(os.homedir(), '.pmm-fallback-dir');

export type PackageManagerName = typeof SUPPORTED_PACKAGE_MANAGERS[number];

export function isSupportedPackageManager(
  input: string
): input is PackageManagerName {
  return SUPPORTED_PACKAGE_MANAGERS.includes(input as any);
}

export function isValidVersionString(version: string) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

export type PackageManagerSpec = {
  name: PackageManagerName;
  version: string;
};
