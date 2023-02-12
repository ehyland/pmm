import stream from 'node:stream';
import * as fs from 'node:fs/promises';
import * as nodeUtil from 'node:util';
import * as logger from './logger';
import * as config from './config';
import * as http from './http';
import { PackageManagerSpec, validateIsSupportedPackageManager } from './spec';
import { Packument } from '@npm/types';
import * as filesystem from './filesystem';

const streamPipeline = nodeUtil.promisify(stream.pipeline);

export async function downloadPackage(spec: PackageManagerSpec) {
  const tar = await import('tar');
  const installPath = filesystem.getInstallPath(spec);

  const response = await http.stream(
    `${config.REGISTRY}/${spec.name}/-/${spec.name}-${spec.version}.tgz`
  );

  await fs.rm(installPath, { force: true, recursive: true }).catch(() => {
    // ignore errors deleting existing dir
  });

  await fs.mkdir(installPath, { recursive: true });

  logger.debug(`Downloading archive`);

  await streamPipeline(
    response.body!,
    tar.extract({ strip: 1, cwd: installPath })
  );
}

export async function getLatestVersion(
  packageManagerName: string
): Promise<PackageManagerSpec> {
  validateIsSupportedPackageManager(packageManagerName);

  const packument = await http.json<Packument>(
    `${config.REGISTRY}/${packageManagerName}`
  );

  const version = packument['dist-tags']['latest'];

  if (!version) {
    throw new Error(`Latest dist-tag not found for ${packageManagerName}`);
  }

  return {
    name: packageManagerName,
    version,
  };
}
