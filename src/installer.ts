import path from 'node:path';
import stream from 'node:stream';
import * as fs from 'node:fs';
import * as nodeUtil from 'node:util';
import { PackageJSON } from './registry/types/package-info';
import * as logger from './logger';
import * as config from './config';
import * as http from './http';

interface InstallOptions {
  spec: config.PackageManagerSpec;
  skipCache?: boolean;
}

interface InstallResult {
  usedCache: boolean;
  installPath: string;
}

const streamPipeline = nodeUtil.promisify(stream.pipeline);

export function getInstallPath({ name, version }: config.PackageManagerSpec) {
  return path.resolve(
    config.PMM_DIR,
    `./installed-versions/${name}-${version}`
  );
}

export async function getIsInCache(spec: config.PackageManagerSpec) {
  const installPath = getInstallPath(spec);

  return fs.promises.stat(installPath).then(
    (stats) => stats.isDirectory(),
    (error: any) => false
  );
}

export async function install({
  spec,
  skipCache = false,
}: InstallOptions): Promise<InstallResult> {
  logger.debug(`Installing ${spec.name}@${spec.version}`);

  const installPath = getInstallPath(spec);

  logger.debug(`To path ${installPath}`);

  const existsInCache = await getIsInCache(spec);

  if (existsInCache && !skipCache) {
    logger.debug(`Skipping install as found in cache`);
    return { installPath, usedCache: true };
  }

  logger.info(`Installing ${spec.name}@${spec.version}`);

  const response = await http.stream(
    `${config.REGISTRY}/${spec.name}/-/${spec.name}-${spec.version}.tgz`
  );

  if (existsInCache) {
    logger.debug(`Clearing cached version`);
    await fs.promises.rm(installPath, { force: true, recursive: true });
  }

  await fs.promises.mkdir(installPath, { recursive: true });

  const tar = await import('tar');

  logger.debug(`Downloading archive`);
  await streamPipeline(response, tar.extract({ strip: 1, cwd: installPath }));

  logger.debug(`Installed`);

  return { installPath, usedCache: false };
}

export async function getLatestVersion(packageManagerName: string) {
  const { version } = await http.json<PackageJSON>(
    `${config.REGISTRY}/${packageManagerName}/latest`
  );

  return {
    version,
  };
}
