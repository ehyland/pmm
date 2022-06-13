import 'v8-compile-cache';

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import * as installer from './installer';
import * as config from './config';
import * as logger from './logger';
import * as inspector from './inspector';
import * as specLib from './spec';
import * as global from './global';
import * as filesystem from './filesystem';

export async function runPackageManager(
  packageManagerName: string,
  executableName = packageManagerName
) {
  if (!specLib.isSupportedPackageManager(packageManagerName)) {
    logger.friendly(
      `"${packageManagerName}" is not supported. Supported: [${config.SUPPORTED_PACKAGE_MANAGERS.join(
        ', '
      )}]`
    );
    return;
  }

  let { spec, packageJSONPath } =
    (await inspector.findPackageManagerSpec()) ?? {};

  if (spec && spec.name !== packageManagerName) {
    const relativePath = path.relative(process.cwd(), packageJSONPath!);
    logger.userError(`This project is configured to use ${spec.name}.`);
    logger.info(`See "packageManager" field in ./${relativePath}`);
    process.exit(1);
  }

  if (!spec) {
    const defaultVersion = await global.getDefaultVersion(packageManagerName);
    spec = { name: packageManagerName, version: defaultVersion };
  }

  if (
    spec.name === 'yarn' &&
    specLib.parseVersionString(spec.version).major >= 2
  ) {
    const defaultVersion = await global.getDefaultVersion(packageManagerName);
    spec = { name: 'yarn', version: defaultVersion };
  }

  await installer.install({ spec });

  const executablePath = await filesystem.getExecutablePath({
    spec,
    executableName,
  });

  const [nodePath, _shimPath, ...argvRest] = process.argv;

  spawnSync(nodePath, [executablePath, ...argvRest], {
    stdio: 'inherit',
    env: process.env,
  });
}
