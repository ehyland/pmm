import execa from 'execa';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { escapeRegExp } from 'lodash';
import ms from 'ms';

const HOME = os.homedir();
const BASH_RC_FILE = path.resolve(HOME, `.bashrc`);
const BASH_RC_LOAD_SCRIPT = `
export PMM_DIR="$HOME/.pmm"
[ -s "$PMM_DIR/package/enable.sh" ] && \. "$PMM_DIR/package/enable.sh"  # This loads pmm shims
`;

const NPMRC_PATH = path.resolve(HOME, '.npmrc');
const PMM_INSTALL_PATH = path.resolve(HOME, '.pmm');
const PMM_BIN_PATH = path.resolve(PMM_INSTALL_PATH, 'package/bin');

const WORKSPACE_PATH = path.resolve(HOME, 'test-workspace/');

async function human(shellCmd: string, { log = false } = {}) {
  const cmd = execa.command(shellCmd, {
    all: true,
    shell: '/bin/bash',
    env: { PATH: `${PMM_BIN_PATH}:${process.env.PATH}` },
  });

  if (log) {
    cmd.all?.on('data', (data) => process.stderr.write(data));
  }

  const result = await cmd;
  return result.all!;
}

async function shell(shellCmd: string, options?: execa.Options<string>) {
  const result = await execa.command(shellCmd, {
    shell: '/bin/bash',
    env: { PATH: `${PMM_BIN_PATH}:${process.env.PATH}` },
    ...options,
  });

  return result;
}

jest.setTimeout(ms('20 seconds'));

let verdaccio: execa.ExecaChildProcess<string>;

beforeAll(async () => {
  if (process.env.IS_RUNNING_IN_TEST_CONTAINER !== 'true') {
    throw new Error(
      'This test suit is designed to be run in a fresh docker environment \nPlease run with ./scripts/test-e2e'
    );
  }

  verdaccio = execa.command(
    'verdaccio --config test/docker-environments/node-16/verdaccio.config.yml',
    {
      encoding: 'utf8',
      all: true,
    }
  );

  await new Promise((resolve) => {
    verdaccio.all!.on('data', (line) => {
      process.stderr.write(line);
      if (/http address/.test(line)) {
        resolve(undefined);
      }
    });
  });

  await execa.command('npm set registry http://localhost:4873/', {
    stdio: 'inherit',
  });

  await fs.appendFile(
    path.resolve(os.homedir(), '.npmrc'),
    // random auth token, not checked by verdaccio
    `\n//localhost:4873/:_authToken="SYLHAHM+lxX2rRAbFIpBXw=="`,
    'utf8'
  );

  await execa.command('./scripts/release-local', { stdio: 'inherit' });
});

afterAll(async () => {
  await fs.rm(PMM_INSTALL_PATH, { recursive: true, force: true }).catch(() => {
    /* ignore */
  });

  await fs.rm(NPMRC_PATH, { recursive: true, force: true }).catch(() => {
    /* ignore */
  });

  await fs.rm(WORKSPACE_PATH, { recursive: true, force: true }).catch(() => {
    /* ignore */
  });

  await new Promise((resolve) => {
    verdaccio.once('exit', () => {
      resolve(undefined);
    });
    verdaccio.kill();
  });
});

describe('test-install-and-usage', () => {
  beforeAll(async () => {
    await human('cat ./install.sh | bash', { log: true });
    await fs.writeFile(BASH_RC_FILE, BASH_RC_LOAD_SCRIPT, 'utf8');
  });

  it('adds pmm bin to path', async () => {
    const path = await human('echo $PATH');
    expect(path).toMatch(new RegExp(`^${escapeRegExp(`${PMM_BIN_PATH}:`)}.+`));
  });

  it('shims & pmm cli to bin path', async () => {
    expect((await fs.readdir(PMM_BIN_PATH)).sort()).toEqual([
      'npm',
      'pmm',
      'pnpm',
    ]);
  });

  it('pmm is in path', async () => {
    expect(await human(`which pmm`)).toEqual(`${PMM_BIN_PATH}/pmm`);
  });

  describe.each([
    { name: 'pnpm', version: '6.32.9' },
    { name: 'pnpm', version: '6.14.7' },
    { name: 'npm', version: '7.24.2' },
    { name: 'npm', version: '6.14.16' },
  ])(
    'in path of a project with "packageManager": "$name@$version"',
    ({ name, version }) => {
      const PROJECT_PATH = path.resolve(WORKSPACE_PATH, name, version);
      const PKG_FILE_PATH = path.resolve(PROJECT_PATH, 'package.json');

      let result: execa.ExecaReturnValue<string>;

      beforeAll(async () => {
        await fs.mkdir(PROJECT_PATH, { recursive: true });
        await fs.writeFile(
          PKG_FILE_PATH,
          JSON.stringify({ packageManager: `${name}@${version}` })
        );
        result = await shell(`${name} -v`, { cwd: PROJECT_PATH });
      });

      it('uses configured package manager', async () => {
        expect(result.stdout).toEqual(version);
      });
    }
  );

  describe.each([{ name: 'pnpm' }, { name: 'npm' }])(
    'when $name is called from a project that has not been configured',
    ({ name }) => {
      const PROJECT_PATH = path.resolve(WORKSPACE_PATH, name, 'default');
      const PKG_FILE_PATH = path.resolve(PROJECT_PATH, 'package.json');

      let result: execa.ExecaReturnValue<string>;
      let loggedVersion: string;

      beforeAll(async () => {
        await fs.mkdir(PROJECT_PATH, { recursive: true });
        await fs.writeFile(
          PKG_FILE_PATH,
          JSON.stringify({
            name: `i-have-not-discovered-the-beauty-that-is-pmm`,
          })
        );
        result = await shell(`${name} -v`, { cwd: PROJECT_PATH });
        loggedVersion = result.stdout;
      });

      it('calls the latest version', () => {
        expect(loggedVersion).toMatch(/\d+\.\d+\.\d+/);
      });

      it('installs the latest version', () => {
        expect(result.stderr).toMatch(
          `🎁  Installing ${name}@${loggedVersion}`
        );
      });

      it('sets it as the as the default', async () => {
        expect(result.stderr).toMatch(
          `🎁  Setting ${name} default to version ${loggedVersion}`
        );
      });

      describe('when called a second time', () => {
        let secondCall: execa.ExecaReturnValue<string>;

        beforeAll(async () => {
          secondCall = await shell(`${name} -v`, { cwd: PROJECT_PATH });
        });

        it('remembers the default', () => {
          expect(secondCall.stderr).toBe('');
          expect(secondCall.stdout).toBe(loggedVersion);
        });
      });
    }
  );
});
