// @ts-check

import { defineConfig, definePlugin } from '@rspack/cli';
import $ from 'nanoexec';
import path, { resolve } from 'node:path';

const packages = [
  [
    'pmm',
    {
      ['v8-compile-cache']: `v8-compile-cache`,
      ['pmm']: './src/index.ts',
      ['pmm-cli']: './src/pmm-cli.ts',
    },
  ],
];

export default defineConfig((_, { mode = 'production' }) => {
  const IS_DEV = mode !== 'production';
  const BUILD_WATCH_RELEASE = !!process.env.BUILD_WATCH_RELEASE;
  const pkgPath = path.resolve('packages/pmm');

  /**
   * @type {import('@rspack/core').RspackOptions}
   */
  const config = {
    mode: mode,
    context: pkgPath,
    target: 'node',
    entry: {
      ['v8-compile-cache']: 'v8-compile-cache',
      ['pmm']: resolve(pkgPath, './src/index.ts'),
      ['pmm-cli']: resolve(pkgPath, './src/pmm-cli.ts'),
    },
    output: {
      path: resolve(pkgPath, 'dist'),
      libraryTarget: `commonjs`,
      clean: true,
    },
    resolve: {
      extensions: [`.ts`, `.js`, '.json'],
    },
    module: {
      noParse: /v8-compile-cache/,
      rules: [
        {
          test: /\.[cm]?(ts|js)$/,
          loader: 'builtin:swc-loader',
          options: {
            jsc: { parser: { syntax: 'typescript' } },
            env: { targets: 'Node >= 18' },
          },
        },
      ],
    },
    stats: {
      assetsSort: `!size`,
    },
    optimization: {
      concatenateModules: false,
    },
    plugins: [],
    watchOptions: {
      ignored: ['**/node_modules', '**/package.json', '**/dist'],
    },
  };

  if (BUILD_WATCH_RELEASE) {
    config.plugins?.push(publishLocalPlugin);
  }

  if (IS_DEV) {
    config.devtool = 'eval-cheap-module-source-map';
  }

  return config;
});

const publishLocalPlugin = definePlugin((compiler) => {
  compiler.hooks.done.tapPromise('PublishLocalPlugin', async (compilation) => {
    await $(resolve('./scripts/release-local'), {
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, IS_CHILD_PROCESS: '1' },
      cwd: resolve('packages/pmm'),
    }).then((r) => r, console.error);

    return undefined;
  });
});
