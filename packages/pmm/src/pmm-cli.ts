import sade from 'sade';
import path from 'node:path';
import * as logger from './logger';
import * as global from './global';
import * as installer from './installer';
import * as registry from './registry';
import * as inspector from './inspector';
import * as specLib from './spec';
import packageHelper from '@npmcli/package-json';
import pkg from '../package.json';
import execa from 'execa';

const cli = sade('pmm');
cli.version(pkg.version);

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
        spec: { name: search.spec.name, version: latest.version },
      });

      logger.info(search.packageJSONPath);

      const pkg = await packageHelper.load(
        path.dirname(search.packageJSONPath)
      );

      pkg.update({
        packageManager: `${search.spec.name}@${latest.version}`,
      });

      await pkg.save();

      logger.friendly(`Updated registry!`);
      logger.info(`  From: ${search.spec.name}@${search.spec.version}`);
      logger.info(`  To  : ${search.spec.name}@${latest.version}`);
    })
  );

cli
  .command(
    'update-default <package-manager> [version]',
    'Update the default package manager version'
  )
  .action(
    handler(async (packageManagerName: string, requestedVersion?: string) => {
      if (!specLib.isSupportedPackageManager(packageManagerName)) {
        logger.userError(`Sorry, "${packageManagerName}" is not yet supported`);
        process.exit(1);
      }

      const version = requestedVersion
        ? requestedVersion
        : (await registry.getLatestVersion(packageManagerName)).version;

      const spec = specLib.parseSpecString(`${packageManagerName}@${version}`);

      await installer.install({ spec });

      await global.updateDefault(spec);
    })
  );

cli.command('update-self', 'Update pmm itself').action(
  handler(async () => {
    await execa.command(
      `curl -o- https://raw.githubusercontent.com/ehyland/pmm/main/install.sh | bash`,
      { shell: '/bin/bash', stdio: 'inherit' }
    );
  })
);

cli.parse(process.argv);
