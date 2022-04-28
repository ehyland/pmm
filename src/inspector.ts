import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs/promises';
import * as config from './config';

export async function findPackageManagerSpec() {
  let current = process.cwd();

  while (current !== path.dirname(current)) {
    const packageInfo = await getPackageInDir(current);
    const specString = packageInfo?.packageManager;

    if (typeof specString === 'string') {
      const spec = parseSpecString(specString);
      if (spec) {
        return { packageJSONPath: current, spec };
      }
    }

    current = path.dirname(current);
  }
}

async function getPackageInDir(dir: string) {
  try {
    const packageString = await fs.readFile(
      path.resolve(dir, 'package.json'),
      'utf8'
    );
    return JSON.parse(packageString);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

function parseSpecString(
  specString: string
): config.PackageManagerSpec | undefined {
  const [packageManager, version] = specString.split('@');

  if (!config.isSupportedPackageManager(packageManager)) {
    return undefined;
  }

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return undefined;
  }

  return { name: packageManager, version };
}
