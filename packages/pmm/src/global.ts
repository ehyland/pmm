import path from 'node:path';
import fs from 'node:fs/promises';
import * as config from './config';
import * as registry from './registry';
import * as logger from './logger';
import * as specLib from './spec';

export async function getDefaultVersion(name: config.PackageManagerName) {
  let version = await getDefaultFromFile(name);

  if (version) {
    return version;
  }

  const latest = await registry.getLatestVersion(name);

  await saveDefaultToFile({ name, version: latest.version });

  return latest.version;
}

export async function updateDefault(spec: specLib.PackageManagerSpec) {
  await saveDefaultToFile(spec);
}

export function getDefaultFilePath(name: config.PackageManagerName) {
  return path.resolve(
    config.PMM_DIR,
    `./installed-versions/.defaults/${name}-version`
  );
}

async function getDefaultFromFile(name: config.PackageManagerName) {
  try {
    const version = await fs.readFile(getDefaultFilePath(name), 'utf8');
    specLib.parseVersionString(version);
    return version;
  } catch (error) {
    // TODO: throw if error other than missing file
    return undefined;
  }
}

async function saveDefaultToFile({
  name,
  version,
}: specLib.PackageManagerSpec) {
  logger.friendly(`Setting ${name} default to version ${version}`);
  await fs.mkdir(path.dirname(getDefaultFilePath(name)), { recursive: true });
  await fs.writeFile(getDefaultFilePath(name), version, 'utf8');
}
