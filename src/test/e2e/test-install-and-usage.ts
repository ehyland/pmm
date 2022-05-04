import execa from 'execa';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { escapeRegExp } from 'lodash';
import ms from 'ms';

const INSTALL_METHOD =
  process.env.PMM_INSTALL_METHOD === 'remote' ? 'remote' : 'local';
const INSTALL_REMOTE_BRANCH = process.env.INSTALL_REMOTE_BRANCH ?? 'main';

const HOME = os.homedir();
const BASH_RC_FILE = path.resolve(HOME, `.bashrc`);
const BASH_RC_LOAD_SCRIPT = `
export PMM_DIR="$HOME/.pmm"
[ -s "$PMM_DIR/package/enable.sh" ] && \. "$PMM_DIR/package/enable.sh"  # This loads pmm shims
`;

const EXPECTED_PMM_BIN_PATH = path.resolve(HOME, '.pmm/package/bin');

async function human(shellCmd: string) {
  const result = await execa.command(shellCmd, {
    all: true,
    shell: '/bin/bash',
    env: { PATH: `${EXPECTED_PMM_BIN_PATH}:${process.env.PATH}` },
  });

  return result.all!;
}

async function shell(shellCmd: string, options?: execa.Options<string>) {
  const result = await execa.command(shellCmd, {
    shell: '/bin/bash',
    env: { PATH: `${EXPECTED_PMM_BIN_PATH}:${process.env.PATH}` },
    ...options,
  });

  return result;
}

jest.setTimeout(ms('20 seconds'));

beforeAll(() => {
  if (process.env.IS_RUNNING_IN_TEST_CONTAINER !== 'true') {
    throw new Error(
      'This test suit is designed to be run in a fresh docker environment \nPlease run with ./scripts/test-e2e'
    );
  }
});

describe('test-install-and-usage', () => {
  beforeAll(async () => {
    if (INSTALL_METHOD === 'local') {
      await human('cat ./install.sh | bash');
    } else {
      await human(
        `curl -o- https://raw.githubusercontent.com/ehyland/pmm/${INSTALL_REMOTE_BRANCH}/install.sh | bash`
      );
    }

    await fs.writeFile(BASH_RC_FILE, BASH_RC_LOAD_SCRIPT, 'utf8');
  });

  it('adds pmm bin to path', async () => {
    const path = await human('echo $PATH');
    expect(path).toMatch(
      new RegExp(`^${escapeRegExp(`${EXPECTED_PMM_BIN_PATH}:`)}.+`)
    );
  });

  it('shims & pmm cli to bin path', async () => {
    expect((await fs.readdir(EXPECTED_PMM_BIN_PATH)).sort()).toEqual([
      'npm',
      'pmm',
      'pnpm',
    ]);
  });

  it('pmm is in path', async () => {
    expect(await human(`which pmm`)).toEqual(`${EXPECTED_PMM_BIN_PATH}/pmm`);
  });

  describe.each([
    { name: 'pnpm', version: '6.32.9' },
    { name: 'pnpm', version: '6.14.7' },
    { name: 'npm', version: '7.24.2' },
    { name: 'npm', version: '6.14.16' },
  ])(
    'in path of a project with "packageManager": "$name@$version"',
    ({ name, version }) => {
      let WORKSPACE_PATH = path.resolve(HOME, 'test-workspace/', name, version);
      let PKG_FILE_PATH = path.resolve(WORKSPACE_PATH, 'package.json');
      let result: execa.ExecaReturnValue<string>;

      beforeAll(async () => {
        await fs.mkdir(WORKSPACE_PATH, { recursive: true });
        await fs.writeFile(
          PKG_FILE_PATH,
          JSON.stringify({ packageManager: `${name}@${version}` })
        );
        result = await shell(`${name} -v`, { cwd: WORKSPACE_PATH });
      });

      it('uses configured package manager', async () => {
        expect(result.stdout).toEqual(version);
      });
    }
  );

  describe.each([{ name: 'pnpm' }, { name: 'npm' }])(
    'when $name is called from a project that has not been configured',
    ({ name }) => {
      let WORKSPACE_PATH = path.resolve(
        HOME,
        'test-workspace/',
        name,
        'default'
      );
      let PKG_FILE_PATH = path.resolve(WORKSPACE_PATH, 'package.json');
      let result: execa.ExecaReturnValue<string>;
      let version: string;

      beforeAll(async () => {
        await fs.mkdir(WORKSPACE_PATH, { recursive: true });
        await fs.writeFile(
          PKG_FILE_PATH,
          JSON.stringify({
            name: `i-have-not-discovered-the-beauty-that-is-pmm`,
          })
        );
        result = await shell(`${name} -v`, { cwd: WORKSPACE_PATH });
        version = result.stdout;
      });

      it('calls the latest version', () => {
        expect(version).toMatch(/\d+\.\d+\.\d+/);
      });

      it('installs the latest version', () => {
        expect(result.stderr).toMatch(`🎁  Installing ${name}@${version}`);
      });

      it('sets it as the as the default', async () => {
        expect(result.stderr).toMatch(
          `🎁  Setting ${name} default to version ${version}`
        );
      });

      describe('when called a second time', () => {
        let secondCall: execa.ExecaReturnValue<string>;

        beforeAll(async () => {
          secondCall = await shell(`${name} -v`, { cwd: WORKSPACE_PATH });
        });

        it('remembers the default', () => {
          expect(secondCall.stderr).toBe('');
          expect(secondCall.stdout).toBe(version);
        });
      });
    }
  );
});
