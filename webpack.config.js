import webpack from 'webpack';
import $ from 'nanoexec';
import { resolve as _resolve } from 'node:path';

const { BannerPlugin } = webpack;

const packages = [
  [
    'pmm',
    {
      ['v8-compile-cache']: `v8-compile-cache`,
      ['pmm']: './src/index.ts',
      ['pmm-cli']: './src/pmm-cli.ts',
    },
  ],
  // [
  //   'pmm-installer',
  //   {
  //     ['v8-compile-cache']: `v8-compile-cache`,
  //     ['installer']: './src/index.ts',
  //   },
  // ],
];

class PublishLocalPlugin {
  /** @type {import("webpack").WebpackPluginFunction} */
  apply(compiler) {
    compiler.hooks.done.tapPromise(
      'PublishLocalPlugin',
      async (compilation) => {
        await $('./scripts/release-local', {
          shell: true,
          stdio: 'inherit',
          cwd: compiler.options.context,
          env: { IS_CHILD_PROCESS: '1' },
        }).then((r) => r, console.error);

        return undefined;
      }
    );
  }
}

export default (_, { mode = 'production' }) => {
  const IS_DEV = mode !== 'production';
  const BUILD_WATCH_RELEASE = !!process.env.BUILD_WATCH_RELEASE;

  /** @type {import("webpack").Configuration[]} */
  return packages.map(([pkgName, entry]) => {
    const pkgPath = _resolve(`packages/${pkgName}`);

    return {
      mode: mode,
      context: pkgPath,
      target: 'node',
      ...(IS_DEV
        ? {
            // development options
            devtool: 'source-map',
          }
        : {
            // production options
            devtool: false,
          }),
      entry: entry,
      output: {
        path: _resolve(pkgPath, 'dist'),
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
            loader: `babel-loader`,
          },
        ],
      },
      stats: {
        assetsSort: `!size`,
      },
      optimization: {
        // webpack was redeclaring a var in the same scope
        concatenateModules: false,
      },
      plugins: [
        new BannerPlugin({
          entryOnly: true,
          banner: `#!/usr/bin/env node\n/* eslint-disable */`,
          raw: true,
        }),
        BUILD_WATCH_RELEASE && new PublishLocalPlugin(),
      ].filter(Boolean),
      watchOptions: {
        ignored: ['**/node_modules', '**/package.json', '**/dist'],
      },
    };
  });
};
