import sade from 'sade';
import path from 'node:path';
import * as logger from './logger';
import * as global from './global';
import * as installer from './installer';
import * as registry from './registry';
import * as inspector from './inspector';
import * as specLib from './spec';
import * as packageJsonUtil from './package-json';
import pkg from '../package.json';
import { execa } from 'execa';
import { SUPPORTED_PACKAGE_MANAGERS } from './config';

const cli = sade('pmm');
cli.version(pkg.version);

const $ = execa({ shell: '/bin/bash', stdio: 'inherit' });

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
  .command('update-local', 'Update package manager version in package.json')
  .action(
    handler(async () => {
      const search = await inspector.findPackageManagerSpec();

      if (!search) {
        logger.userError(
          `Unable to find package.json with "packageManager" field`
        );
        process.exit(1);
      }

      const latest = await registry.getLatestVersion(search.spec.name);

      if (latest.version === search.spec.version) {
        logger.info(
          `Already on latest version ${search.spec.name}@${latest.version}`
        );
        return;
      }

      await installer.install({
        spec: latest,
      });

      logger.info(search.packageJSONPath);

      await packageJsonUtil.updateSpecInPackageJson(
        search.packageJSONPath,
        latest
      );

      logger.friendly(`Updated registry!`);
      logger.info(`  From: ${search.spec.name}@${search.spec.version}`);
      logger.info(`  To  : ${search.spec.name}@${latest.version}`);
    })
  );

cli
  .command(
    'update-default [package-manager] [version]',
    'Update the default package manager version'
  )
  .action(
    handler(async (nameParam: string = 'all', versionParam?: string) => {
      const toUpdate: specLib.PackageManagerSpec[] = [];

      if (nameParam === 'all') {
        logger.friendly(`Updating all package managers`);
        for (const name of SUPPORTED_PACKAGE_MANAGERS) {
          toUpdate.push(await registry.getLatestVersion(name));
        }
      } else if (!specLib.isSupportedPackageManager(nameParam)) {
        logger.userError(`Sorry, "${nameParam}" is not yet supported`);
        process.exit(1);
      } else {
        toUpdate.push(await registry.getLatestVersion(nameParam));
      }

      for (const spec of toUpdate) {
        await installer.install({ spec });
        await global.updateDefault(spec);
      }
    })
  );

cli.command('update-self', 'Update pmm itself').action(
  handler(async () => {
    await $`curl -o- https://raw.githubusercontent.com/ehyland/pmm/main/install.sh | bash`;
  })
);

cli
  .command(
    'pin <package-manager> <path-to-package>',
    'Write packageManager field to package.json'
  )
  .action(
    handler(async (packageManagerName: string, inputPath: string) => {
      if (!specLib.isSupportedPackageManager(packageManagerName)) {
        logger.userError(`Sorry, "${packageManagerName}" is not yet supported`);
        process.exit(1);
      }

      const absoluteInputPath = path.resolve(inputPath);
      const packageDir = absoluteInputPath.endsWith('package.json')
        ? path.dirname(absoluteInputPath)
        : absoluteInputPath;

      if (!(await inspector.checkPackageExists(packageDir))) {
        logger.userError(
          `Sorry, "package.json" not found in ./${path.relative(
            process.cwd(),
            packageDir
          )}`
        );
        process.exit(1);
      }

      const latest = await registry.getLatestVersion(packageManagerName);

      await packageJsonUtil.updateSpecInPackageJson(
        path.resolve(packageDir, 'package.json'),
        latest
      );

      logger.friendly(`Pinned ${packageManagerName}@${latest.version}`);
    })
  );

cli.parse(process.argv);
