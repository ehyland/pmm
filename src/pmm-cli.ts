import sade from "sade";
import * as logger from "./logger";
import * as defaults from "./defaults";
import * as installer from "./installer";
import * as inspector from "./inspector";
import * as config from "./config";
import { getLatestVersion } from "./installer";
import { isSupportedPackageManager } from "./config";
import packageHelper from "@npmcli/package-json";

const cli = sade("pmm");

function handler(cb: sade.Handler): sade.Handler {
  return async (...args: any[]) => {
    try {
      await cb(...args);
    } catch (error) {
      console.error(error);
      logger.userError(`Dang, hit a snag`);
      process.exit(1);
    }
  };
}

cli
  .command("update-local", "Update package manager version in package.json")
  .action(
    handler(async () => {
      const search = await inspector.findPackageManagerSpec();

      if (!search) {
        logger.userError(
          `Unable to find package.json with "packageManager" field`
        );
        process.exit(0);
      }

      const latest = await getLatestVersion(search.spec.name);

      await installer.install({
        spec: { name: search.spec.name, version: latest.version },
      });

      const pkg = await packageHelper.load(search.packageJSONPath);

      pkg.update({
        packageManager: `${search.spec.name}@${latest.version}`,
      });

      await pkg.save();
    })
  );

cli
  .command(
    "update-default <package-manager> [version]",
    "Update the default package manager version"
  )
  .action(
    handler(async (packageManagerName: string, requestedVersion?: string) => {
      if (!isSupportedPackageManager(packageManagerName)) {
        logger.userError(`Sorry, "${packageManagerName}" is not yet supported`);
        process.exit(1);
      }

      if (requestedVersion && !config.isValidVersionString(requestedVersion)) {
        logger.userError(`Invalid version "${requestedVersion}"`);
        process.exit(1);
      }

      const version = requestedVersion
        ? requestedVersion
        : (await getLatestVersion(packageManagerName)).version;

      const spec = { name: packageManagerName, version: version };

      await installer.install({ spec });

      await defaults.updateDefault(spec);
    })
  );

cli.parse(process.argv);
