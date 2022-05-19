const webpack = require(`webpack`);
const path = require('node:path');
const execa = require('execa');

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
        await execa
          .command(path.resolve(`./scripts/release-local`), {
            stdio: 'inherit',
            cwd: compiler.options.context,
            env: {
              IS_CHILD_PROCESS: '1',
            },
          })
          .catch((e) => console.error(e));

        return undefined;
      }
    );
  }
}

module.exports = (_, { mode = 'production' }) => {
  const IS_DEV = mode !== 'production';
  const BUILD_WATCH_RELEASE = !!process.env.BUILD_WATCH_RELEASE;

  /** @type {import("webpack").Configuration[]} */
  return packages.map(([pkgName, entry]) => {
    const pkgPath = path.resolve(`packages/${pkgName}`);

    return {
      mode: mode,
      context: pkgPath,
      target: 'node',
      ...(IS_DEV
        ? {
            // development options
          }
        : {
            // production options
            devtool: false,
          }),
      entry: entry,
      output: {
        path: path.resolve(pkgPath, 'dist'),
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
        new webpack.BannerPlugin({
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
