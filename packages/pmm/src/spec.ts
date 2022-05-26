import { PackageManagerName, SUPPORTED_PACKAGE_MANAGERS } from './config';

export function isSupportedPackageManager(
  input: string
): input is PackageManagerName {
  return SUPPORTED_PACKAGE_MANAGERS.includes(input as any);
}

export type PackageManagerSpec = {
  name: PackageManagerName;
  version: string;
};

export function parseVersionString(versionString: string) {
  const versionMatch = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/.exec(
    versionString
  );

  if (!versionMatch) {
    throw new Error(
      `Invalid version format. Must be a fully qualified version. e.g. "6.43.2"`
    );
  }

  return {
    major: Number(versionMatch.groups?.major),
    minor: Number(versionMatch.groups?.minor),
    patch: Number(versionMatch.groups?.patch),
  };
}

export function parseSpecString(specString: string): PackageManagerSpec {
  const [packageManager, version] = specString.split('@');

  if (!isSupportedPackageManager(packageManager)) {
    throw new Error(
      `Unsupported package manager "${packageManager}". pmm supports ${SUPPORTED_PACKAGE_MANAGERS.join(
        ', '
      )}`
    );
  }

  return { name: packageManager, version };
}

export function stringify(spec: PackageManagerSpec) {
  return `${spec.name}@${spec.version}`;
}
