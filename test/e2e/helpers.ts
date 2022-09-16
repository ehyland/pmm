import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import execa from 'execa';

export const HOME = os.homedir();
export const BASH_RC_FILE = path.resolve(HOME, `.bashrc`);
export const BASH_RC_LOAD_SCRIPT = `
export PMM_DIR="$HOME/.pmm"
export PMM_NPM_REGISTRY="http://localhost:48733"
[ -s "$PMM_DIR/package/enable.sh" ] && \. "$PMM_DIR/package/enable.sh"  # This loads pmm shims
`;

export const NPMRC_PATH = path.resolve(HOME, '.npmrc');
export const PMM_DIR = path.resolve(HOME, '.pmm');
export const PMM_BIN_PATH = path.resolve(PMM_DIR, 'package/bin');

export const WORKSPACE_PATH = path.resolve(HOME, 'test-workspace/');

export type TestProject = Awaited<ReturnType<typeof setupTestProject>>;

const { LOCAL_NPM_REGISTRY, IS_RUNNING_IN_TEST_CONTAINER } = process.env;

let testProjectCount = 0;

export async function setupTestProject({
  subDir = `test-project-${testProjectCount++}`,
  packageManager,
  scripts = {},
}: {
  subDir?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
}) {
  const projectPath = path.resolve(WORKSPACE_PATH, subDir);
  const packageFilePath = path.resolve(projectPath, 'package.json');
  await fs.mkdir(projectPath, { recursive: true });
  await fs.writeFile(
    packageFilePath,
    JSON.stringify({ packageManager: packageManager, scripts })
  );
  return { projectPath, packageFilePath };
}

export async function human(
  shellCmd: string,
  { log = false, cwd = process.cwd() } = {}
) {
  const cmd = execa.command(`source ${BASH_RC_FILE} || true && ${shellCmd}`, {
    all: true,
    shell: '/bin/bash',
    cwd: cwd,
    env: { PATH: `${PMM_BIN_PATH}:${process.env.PATH}` },
  });

  if (log) {
    cmd.all?.on('data', (data) => process.stderr.write(data));
  }

  const result = await cmd;
  return result.all!;
}

export async function shell(shellCmd: string, options?: execa.Options<string>) {
  const result = await execa.command(
    `source ${BASH_RC_FILE} || true && ${shellCmd}`,
    {
      shell: '/bin/bash',
      env: { PATH: `${PMM_BIN_PATH}:${process.env.PATH}` },
      ...options,
    }
  );

  return result;
}

export async function assertValidTestEnvironment() {
  if (IS_RUNNING_IN_TEST_CONTAINER !== 'true') {
    throw new Error(
      'This test suit is designed to be run in a fresh docker environment \nPlease run with ./scripts/test-e2e'
    );
  }

  if (typeof LOCAL_NPM_REGISTRY === 'undefined') {
    throw new Error('Missing LOCAL_NPM_REGISTRY');
  }
}

export async function resetBashRc() {
  await fs.writeFile(BASH_RC_FILE, '', 'utf8');
}

export async function setNpmRegistry() {
  await human(`npm set registry ${LOCAL_NPM_REGISTRY} --global`, {
    log: true,
    cwd: HOME,
  });
}

export async function cleanup() {
  await fs.rm(PMM_DIR, { recursive: true, force: true }).catch(() => {
    /* ignore */
  });

  await fs.rm(NPMRC_PATH, { recursive: true, force: true }).catch(() => {
    /* ignore */
  });

  await fs.rm(WORKSPACE_PATH, { recursive: true, force: true }).catch(() => {
    /* ignore */
  });
}

export async function installPmm() {
  const output = await human('cat ./install.sh | bash', { log: true });
  await fs.writeFile(BASH_RC_FILE, BASH_RC_LOAD_SCRIPT, 'utf8');
  return output;
}

export async function callAndCatch(fn: (...args: any[]) => Promise<any>) {
  try {
    await fn();
  } catch (error: any) {
    return error;
  }
  throw new Error(`expected ${fn.name} to reject`);
}

export async function loadPackageJson(packagePath: string) {
  return JSON.parse(await fs.readFile(packagePath, 'utf8'));
}
