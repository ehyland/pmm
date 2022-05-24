import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs/promises';
import * as specLib from './spec';

export async function findPackageManagerSpec() {
  let current = process.cwd();

  while (current !== path.dirname(current)) {
    const packageInfo = await getPackageInDir(current);
    const specString = packageInfo?.packageManager;

    if (typeof specString === 'string') {
      const spec = specLib.parseSpecString(specString);
      return { packageJSONPath: path.resolve(current, 'package.json'), spec };
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
