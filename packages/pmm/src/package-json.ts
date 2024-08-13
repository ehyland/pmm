import fs from 'node:fs/promises';
import { PackageManagerSpec } from './spec';

export async function readPackageJson(
  packageJsonPath: string
): Promise<PackageJson> {
  const content = await fs.readFile(packageJsonPath, { encoding: 'utf8' });
  const pkg = JSON.parse(content);
  return pkg;
}

export async function writePackageJson(
  packageJsonPath: string,
  pkg: PackageJson
): Promise<void> {
  const content = JSON.stringify(pkg);
  await fs.writeFile(packageJsonPath, content, { encoding: 'utf8' });
}

export async function updateSpecInPackageJson(
  packageJsonPath: string,
  newSpec: PackageManagerSpec
): Promise<void> {
  const pkg = await readPackageJson(packageJsonPath);
  pkg.packageManager = `${newSpec.name}@${newSpec.version}`;
  await writePackageJson(packageJsonPath, pkg);
}

export type PackageJson = {
  name: string;
  version: string;
  description?: string;
  main?: string;
  packageManager?: string;
  scripts?: ObjectOfStrings;
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
  peerDependencies?: Dependencies;
  bundleDependencies?: Dependencies;
  bundledDependencies?: Dependencies;
  engines?: ObjectOfStrings;
  files?: string[];
  bin?: ObjectOfStrings;
};

type ObjectOfStrings = {
  [key: string]: string;
};

type Dependencies = {
  [moduleName: string]: string;
};
