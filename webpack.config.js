const TerserPlugin = require(`terser-webpack-plugin`);
const webpack = require(`webpack`);
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('node:path');

const pkgPath = path.resolve('packages/pmm');

/** @type {import("webpack").Configuration} */
module.exports = {
  context: pkgPath,
  mode: 'production',
  target: 'node',
  devtool: false,
  entry: {
    ['v8-compile-cache']: `v8-compile-cache`,
    ['pmm']: './src/index.ts',
    ['pmm-cli']: './src/pmm-cli.ts',
  },
  output: {
    path: path.resolve(pkgPath, 'dist'),
    libraryTarget: `commonjs`,
  },
  resolve: {
    extensions: [`.ts`, `.js`],
  },
  module: {
    noParse: /v8-compile-cache/,
    rules: [
      {
        test: /\.ts$/,
        loader: `ts-loader`,
        options: {
          transpileOnly: true,
          compilerOptions: {
            module: `es2020`,
            noEmit: false,
          },
        },
      },
    ],
  },
  stats: {
    assetsSort: `!size`,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.BannerPlugin({
      entryOnly: true,
      banner: `#!/usr/bin/env node\n/* eslint-disable */`,
      raw: true,
    }),
  ],
};
