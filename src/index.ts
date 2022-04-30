import "v8-compile-cache";

import { spawnSync } from "node:child_process";
import path from "node:path";
import * as installer from "./installer";
import * as config from "./config";
import * as logger from "./logger";
import * as inspector from "./inspector";
import { getDefaultVersion } from "./defaults";

export async function runPackageManager(packageManager: string) {
  if (!config.isSupportedPackageManager(packageManager)) {
    logger.friendly(
      `"${packageManager}" is not supported. Supported: [${config.SUPPORTED_PACKAGE_MANAGERS.join(
        ", "
      )}]`
    );
    return;
  }

  let { spec, packageJSONPath } =
    (await inspector.findPackageManagerSpec()) ?? {};

  if (spec && spec.name !== packageManager) {
    const relativePath = path.relative(process.cwd(), packageJSONPath!);
    logger.userError(`This project is configured to use ${spec.name}.`);
    logger.info(`See "packageManager" field in ./${relativePath}`);
    process.exit(1);
  }

  if (!spec) {
    const defaultVersion = await getDefaultVersion(packageManager);
    spec = { name: packageManager, version: defaultVersion };
  }

  const { installPath } = await installer.install({ spec });

  const [nodePath, _shimPath, ...argvRest] = process.argv;

  spawnSync(nodePath, [installPath, ...argvRest], {
    stdio: "inherit",
    env: process.env,
  });
}
