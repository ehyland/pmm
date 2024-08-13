import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as specLib from './spec';
import { PMM_DIR } from './config';
import { PackageJson } from './package-json';

export function getInstallPath({ name, version }: specLib.PackageManagerSpec) {
  return path.resolve(PMM_DIR, `./installed-versions/${name}-${version}`);
}

export function getInstallPackageJSONPath(spec: specLib.PackageManagerSpec) {
  return path.resolve(getInstallPath(spec), 'package.json');
}

export async function getExecutablePath({
  executableName,
  spec,
}: {
  spec: specLib.PackageManagerSpec;
  executableName: string;
}) {
  const installPath = getInstallPath(spec);
  const pkg = await readPackageManagerPackageFromCache(spec, {
    throwOnMissing: true,
  });
  const relativeExecutablePath = pkg.bin?.[executableName];

  if (!relativeExecutablePath) {
    throw new Error(`Missing bin path for ${executableName} in package.json`);
  }

  return path.resolve(installPath, relativeExecutablePath);
}

const pkgCache = new Map<string, PackageJson>();

export async function readPackageManagerPackageFromCache(
  spec: specLib.PackageManagerSpec,
  opts: { throwOnMissing: true }
): Promise<PackageJson>;

export async function readPackageManagerPackageFromCache(
  spec: specLib.PackageManagerSpec
): Promise<PackageJson | undefined>;

export async function readPackageManagerPackageFromCache(
  spec: specLib.PackageManagerSpec,
  { throwOnMissing = false } = {}
) {
  const cacheKey = specLib.stringify(spec);
  const cached = pkgCache.get(cacheKey);

  if (cached) return cached;

  const content = await fs
    .readFile(getInstallPackageJSONPath(spec), 'utf8')
    .catch((e) => undefined);

  if (!content) {
    if (throwOnMissing) {
      throw new Error(`Unable to find package for ${cacheKey}`);
    }
    return undefined;
  }

  const pkg = JSON.parse(content) as PackageJson;
  pkgCache.set(cacheKey, pkg);

  return pkg;
}
