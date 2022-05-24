import path from 'node:path';
import stream from 'node:stream';
import * as fs from 'node:fs';
import * as nodeUtil from 'node:util';
import { Packument, PackageJson } from '@npm/types';
import * as logger from './logger';
import * as config from './config';
import * as http from './http';
import * as specLib from './spec';

interface InstallOptions {
  spec: specLib.PackageManagerSpec;
  skipCache?: boolean;
}

interface InstallResult {
  usedCache: boolean;
  installPath: string;
  executablePath: string;
}

const streamPipeline = nodeUtil.promisify(stream.pipeline);

export function getInstallPath({ name, version }: specLib.PackageManagerSpec) {
  return path.resolve(
    config.PMM_DIR,
    `./installed-versions/${name}-${version}`
  );
}

export async function getIsInCache(spec: specLib.PackageManagerSpec) {
  const installPath = getInstallPath(spec);

  return fs.promises.stat(installPath).then(
    (stats) => stats.isDirectory(),
    (error: any) => false
  );
}

export async function readPackage(
  spec: specLib.PackageManagerSpec
): Promise<PackageJson | undefined> {
  const installPath = getInstallPath(spec);
  const packagePath = path.resolve(installPath, 'package.json');
  const packageFileContents = await fs.promises
    .readFile(packagePath, 'utf8')
    .catch((e) => undefined);

  if (!packageFileContents) return undefined;

  try {
    return JSON.parse(packageFileContents) as PackageJson;
  } catch (error) {
    logger.info(`Error reading ${packagePath}`);
  }
}

export async function install({
  spec,
  skipCache = false,
}: InstallOptions): Promise<InstallResult> {
  logger.debug(`Installing ${spec.name}@${spec.version}`);

  const installPath = getInstallPath(spec);

  logger.debug(`To path ${installPath}`);

  const packageFromCache = await readPackage(spec);

  if (packageFromCache && !skipCache) {
    logger.debug(`Skipping install as found in cache`);

    const executablePath = getExecutablePath({
      installPath,
      pkg: packageFromCache,
      executableName: spec.name,
    });

    return {
      installPath,
      executablePath,
      usedCache: true,
    };
  }

  logger.friendly(`Installing ${spec.name}@${spec.version}`);

  const response = await http.stream(
    `${config.REGISTRY}/${spec.name}/-/${spec.name}-${spec.version}.tgz`
  );

  if (packageFromCache) {
    logger.debug(`Clearing cached version`);
    await fs.promises.rm(installPath, { force: true, recursive: true });
  }

  await fs.promises.mkdir(installPath, { recursive: true });

  const tar = await import('tar');

  logger.debug(`Downloading archive`);
  await streamPipeline(response, tar.extract({ strip: 1, cwd: installPath }));

  logger.debug(`Installed`);

  const freshPackage = await readPackage(spec);

  if (!freshPackage) {
    throw new Error('package.json not found after install');
  }

  const executablePath = getExecutablePath({
    installPath,
    pkg: freshPackage,
    executableName: spec.name,
  });

  return {
    installPath,
    executablePath,
    usedCache: false,
  };
}

export async function getLatestVersion(packageManagerName: string) {
  const packument = await http.json<Packument>(
    `${config.REGISTRY}/${packageManagerName}`
  );

  const version = packument['dist-tags']['latest'];

  if (!version) {
    throw new Error(`Latest dist-tag not found for ${packageManagerName}`);
  }

  return {
    version,
  };
}

function getExecutablePath(options: {
  installPath: string;
  pkg: PackageJson;
  executableName: string;
}) {
  const relativeExecutablePath = options.pkg.bin?.[options.executableName];

  if (!relativeExecutablePath) {
    throw new Error(
      `Missing bin path for ${options.executableName} in package.json`
    );
  }

  return path.resolve(options.installPath, relativeExecutablePath);
}
