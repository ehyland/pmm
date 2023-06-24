import execa from 'execa';
import fs from 'node:fs/promises';
import path from 'node:path';
import { escapeRegExp } from 'lodash';
import ms from 'ms';

import {
  PMM_BIN_PATH,
  WORKSPACE_PATH,
  setupTestProject,
  TestProject,
  shell,
  human,
  assertValidTestEnvironment,
  resetBashRc,
  setNpmRegistry,
  cleanup,
  installPmm,
  callAndCatch,
  loadPackageJson,
} from './helpers';

jest.setTimeout(ms('20 seconds'));

const SPEC_RX =
  /(?<name>(pnpm|npm|yarn))@(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/;

const VERSION_RX = /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/;

beforeAll(async () => {
  await assertValidTestEnvironment();
  await resetBashRc();
  await setNpmRegistry();
});

afterAll(async () => {
  await cleanup();
});

describe('Install and usage', () => {
  let installOutput: string;

  beforeAll(async () => {
    installOutput = await installPmm();
  });

  it('logs useful output', () => {
    const match = installOutput.match(/To Complete Installation(.|\n)*/m);
    expect(match?.[0]).toMatchInlineSnapshot(`
      "To Complete Installation
      ------------------------
      Add the following to your ~/.bashrc
        export PMM_DIR="$HOME/.pmm"
        export PMM_NPM_REGISTRY="http://localhost:48733"
        [ -s "$PMM_DIR/package/enable.sh" ] && \\. "$PMM_DIR/package/enable.sh"  # This loads pmm shims"
    `);
  });

  it('adds pmm bin to path', async () => {
    const path = await human('echo $PATH');
    expect(path).toMatch(new RegExp(`^${escapeRegExp(`${PMM_BIN_PATH}:`)}.+`));
  });

  it('shims & pmm cli to bin path', async () => {
    expect((await fs.readdir(PMM_BIN_PATH)).sort()).toEqual([
      'npm',
      'npx',
      'pmm',
      'pnpm',
      'pnpx',
      'yarn',
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
    { name: 'yarn', version: '1.21.1' },
    { name: 'yarn', version: '1.10.1' },
  ])(
    'in path of a project with "packageManager": "$name@$version"',
    ({ name, version }) => {
      let testProject: TestProject;
      let result: execa.ExecaReturnValue<string>;

      beforeAll(async () => {
        testProject = await setupTestProject({
          subDir: `${name}/${version}`,
          packageManager: `${name}@${version}`,
        });
        result = await shell(`${name} -v`, { cwd: testProject.projectPath });
      });

      it('uses configured package manager', async () => {
        expect(result.stdout).toEqual(version);
      });
    }
  );

  describe.each([{ name: 'pnpm' }, { name: 'npm' }, { name: 'yarn' }])(
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

  describe('pmm update-local', () => {
    describe('when called in a directory without pm spec', () => {
      let testProject: TestProject;
      let error: execa.ExecaError;

      beforeAll(async () => {
        testProject = await setupTestProject({ subDir: 'not-configured' });
        error = await callAndCatch(() =>
          human(`pmm update-local`, {
            cwd: testProject.projectPath,
          })
        );
      });

      it('exits with error', () => {
        expect(error.all).toBe(
          `⚠️  Unable to find package.json with "packageManager" field`
        );
      });
    });

    describe('when called in a directory with pm spec', () => {
      let testProject: TestProject;

      beforeAll(async () => {
        testProject = await setupTestProject({
          subDir: 'configured',
          packageManager: 'npm@6.0.0',
        });
        await human(`pmm update-local`, {
          cwd: testProject.projectPath,
        });
      });

      it('update the packageManager field', async () => {
        const { packageManager } = await loadPackageJson(
          testProject.packageFilePath
        );

        const match = /^npm@(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/.exec(
          packageManager
        )!;

        expect(Number(match.groups?.major)).toBeGreaterThan(6);
      });
    });
  });

  describe('pmm update-default', () => {
    let testProject: TestProject;
    let output: String;

    beforeAll(async () => {
      testProject = await setupTestProject({});
      output = await human(`pmm update-default`, {
        cwd: testProject.projectPath,
      });
    });

    it('updates the default packageManagers', async () => {
      expect(output).toMatch('🎁  Updating all package managers');
      expect(output).toMatch(
        new RegExp(`🎁  Setting pnpm default to version ${VERSION_RX.source}`)
      );
      expect(output).toMatch(
        new RegExp(`🎁  Setting npm default to version ${VERSION_RX.source}`)
      );
      expect(output).toMatch(
        new RegExp(`🎁  Setting yarn default to version ${VERSION_RX.source}`)
      );
    });
  });

  describe('pmm pin <manager> <path>', () => {
    describe('when called in a directory without pm spec', () => {
      let testProject: TestProject;
      let result: string;

      beforeAll(async () => {
        testProject = await setupTestProject({ subDir: 'not-configured' });
        result = await human(`pmm pin pnpm .`, {
          cwd: testProject.projectPath,
        });
      });

      it('writes success message', () => {
        const messageRx = new RegExp(`🎁  Pinned ${SPEC_RX.source}`);
        expect(result).toMatch(messageRx);
        expect(messageRx.exec(result)?.groups?.name).toBe('pnpm');
        expect(
          Number(messageRx.exec(result)?.groups?.major)
        ).toBeGreaterThanOrEqual(7);
      });

      it('writes packageManager field', async () => {
        const { packageManager } = await loadPackageJson(
          testProject.packageFilePath
        );

        const rx = new RegExp(`^${SPEC_RX.source}$`);
        const match = rx.exec(packageManager)!;

        expect(match.groups?.name).toBe('pnpm');
        expect(Number(match.groups?.major)).toBeGreaterThanOrEqual(7);
      });
    });

    describe('when called in a directory without package', () => {
      let testProject: TestProject;
      let error: execa.ExecaError;

      beforeAll(async () => {
        testProject = await setupTestProject({ subDir: 'not-configured' });
        error = await callAndCatch(() =>
          human(`pmm pin pnpm ./some-random-subpath`, {
            cwd: testProject.projectPath,
          })
        );
      });

      it('exits with error', () => {
        expect(error.all).toBe(
          `⚠️  Sorry, "package.json" not found in ./some-random-subpath`
        );
      });
    });
  });

  describe('in a yarn berry project', () => {
    let testProject: TestProject;
    let result: string;

    beforeAll(async () => {
      testProject = await setupTestProject({
        packageManager: 'yarn@3.2.1',
      });
      await human(`yarn set version 3.2.1`, {
        cwd: testProject.projectPath,
      });
      result = await human(`yarn -v`, {
        cwd: testProject.projectPath,
      });
    });

    it('prints yarn berry version', () => {
      expect(result).toBe('3.2.1');
    });
  });

  describe('npx', () => {
    let result: string;

    beforeAll(async () => {
      const testProject = await setupTestProject({});
      result = await human(`npx -y cowsay@1.5.0 How good is pmm!`, {
        cwd: testProject.projectPath,
      });
    });

    it('runs the cowsay cli', () => {
      expect(result).toMatchInlineSnapshot(`
        " __________________
        < How good is pmm! >
         ------------------
                \\   ^__^
                 \\  (oo)\\_______
                    (__)\\       )\\/\\
                        ||----w |
                        ||     ||"
      `);
    });
  });

  describe('pnpx', () => {
    let result: execa.ExecaReturnValue<string>;

    beforeAll(async () => {
      const testProject = await setupTestProject({});
      result = await shell(`pnpx cowsay@1.5.0 Yeah not bad m8`, {
        cwd: testProject.projectPath,
      });
    });

    it('runs the cowsay cli', () => {
      expect(result.stdout).toMatchInlineSnapshot(`
        " _________________
        < Yeah not bad m8 >
         -----------------
                \\   ^__^
                 \\  (oo)\\_______
                    (__)\\       )\\/\\
                        ||----w |
                        ||     ||"
      `);
    });
  });

  describe('when a package manager is called as a child process', () => {
    let result: execa.ExecaReturnValue<string>;

    beforeAll(async () => {
      const testProject = await setupTestProject({
        packageManager: 'pnpm@7.5.1',
        scripts: {
          'get-npm-version': 'npm --version',
        },
      });

      result = await shell(`pnpm run get-npm-version`, {
        cwd: testProject.projectPath,
      });
    });

    it('allows npm to be called', () => {
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('when a package manager exits with a non zero code', () => {
    let result: execa.ExecaReturnValue<string>;

    beforeAll(async () => {
      const testProject = await setupTestProject({
        packageManager: 'pnpm@7.5.1',
        scripts: {
          'script-with-exit-code': 'exit 1',
        },
      });

      result = await shell(`pnpm run script-with-exit-code`, {
        cwd: testProject.projectPath,
        reject: false,
      });
    });

    it('exits with same code', () => {
      expect(result.exitCode).toEqual(1);
    });
  });
});
