import 'v8-compile-cache';

import { spawnSync } from 'node:child_process';
import * as installer from './installer';
import * as config from './config';
import * as logger from './logger';
import * as inspector from './inspector';
import { getDefaultVersion } from './defaults';

export async function runPackageManager(packageManager: string) {
  if (!config.isSupportedPackageManager(packageManager)) {
    logger.info(
      `"${packageManager}" is not supported. Supported: [${config.SUPPORTED_PACKAGE_MANAGERS.join(
        ', '
      )}]`
    );
    return;
  }

  let { spec } = (await inspector.findPackageManagerSpec()) ?? {};

  if (!spec) {
    const defaultVersion = await getDefaultVersion(packageManager);
    spec = { name: packageManager, version: defaultVersion };
  }

  const { installPath } = await installer.install({ spec });

  const [nodePath, _shimPath, ...argvRest] = process.argv;

  spawnSync(nodePath, [installPath, ...argvRest], {
    stdio: 'inherit',
    env: process.env,
  });
}
