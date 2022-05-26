import * as logger from './logger';
import * as specLib from './spec';
import * as filesystem from './filesystem';
import * as registry from './registry';

interface InstallOptions {
  spec: specLib.PackageManagerSpec;
  skipCache?: boolean;
}

interface InstallResult {
  usedCache: boolean;
}

export async function install({
  spec,
  skipCache = false,
}: InstallOptions): Promise<InstallResult> {
  logger.debug(`Installing ${spec.name}@${spec.version}`);

  let pkg = await filesystem.readPackageFromCache(spec);

  if (pkg && !skipCache) {
    logger.debug(`Skipping install as found in cache`);

    return {
      usedCache: true,
    };
  }

  logger.friendly(`Installing ${spec.name}@${spec.version}`);

  await registry.downloadPackage(spec);

  pkg = await filesystem.readPackageFromCache(spec, { throwOnMissing: true });

  return {
    usedCache: false,
  };
}
