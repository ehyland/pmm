import sade from 'sade';
import pkg from '../package.json';
import npmFetch from 'npm-registry-fetch';
import pickManifest from 'npm-pick-manifest';
import npa from 'npm-package-arg';
import * as logger from '../../pmm/src/logger';
import * as http from '../../pmm/src/http';
import tar from 'tar';
import { promisify } from 'node:util';
import stream from 'node:stream';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import chmodr from 'chmodr';

const cli = sade('pmm-installer [version]', true);

cli
  .version(pkg.version)
  .example('pmm-installer latest')
  .example('pmm-installer 0.2.3')
  .option('--plz', 'Be nice');

async function handler(rawVersionSpec: string = 'latest') {
  const spec = npa(`@ehyland/pmm@${rawVersionSpec}`);
  const result = await npmFetch.json('@ehyland/pmm');
  const manifest = pickManifest(result, spec.fetchSpec!);

  logger.friendly(`Installing pmm@${manifest.version}`);

  const PMM_DIR = path.resolve(os.homedir(), '.pmm');
  const PMM_PACKAGE_PATH = path.resolve(PMM_DIR, 'package');
  const PMM_PACKAGE_BIN_PATH = path.resolve(PMM_PACKAGE_PATH, 'bin');

  await fs.rm(PMM_PACKAGE_PATH, { force: true, recursive: true }).catch((e) => {
    // Ignore errors while deleting old install.
    // If there's a permission issue, we'll hit it with mkdir.
  });

  await fs.mkdir(PMM_PACKAGE_PATH, { recursive: true });

  const response = await http.stream(manifest.dist.tarball!);

  await promisify(stream.pipeline)(
    response,
    tar.extract({ strip: 1, cwd: PMM_PACKAGE_PATH })
  );

  await promisify(chmodr)(PMM_PACKAGE_BIN_PATH, 0o755);

  logger.friendly(`Installed to ${PMM_DIR}`);
  logger.info(`
  Add the following to your ~/.bashrc
    export PMM_DIR="$HOME/.pmm"
    [ -s "$PMM_DIR/package/enable.sh" ] && \. "$PMM_DIR/package/enable.sh"  # This loads pmm shims
`);
}

cli.action(handler);
cli.parse(process.argv);
