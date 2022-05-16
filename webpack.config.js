const webpack = require(`webpack`);
const path = require('node:path');

const packages = [
  [
    'pmm',
    {
      ['v8-compile-cache']: `v8-compile-cache`,
      ['pmm']: './src/index.ts',
      ['pmm-cli']: './src/pmm-cli.ts',
    },
  ],
  [
    'pmm-installer',
    {
      ['v8-compile-cache']: `v8-compile-cache`,
      ['installer']: './src/index.ts',
    },
  ],
];

module.exports = (_, { mode = 'production' }) => {
  /** @type {import("webpack").Configuration[]} */
  return packages.map(([pkgName, entry]) => {
    const pkgPath = path.resolve(`packages/${pkgName}`);

    return {
      mode: mode,
      context: pkgPath,
      target: 'node',
      ...(mode === 'production'
        ? {
            // production options
            devtool: false,
          }
        : {
            // development options
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
      ],
    };
  });
};
