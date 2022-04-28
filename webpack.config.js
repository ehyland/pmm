const TerserPlugin = require(`terser-webpack-plugin`);
const webpack = require(`webpack`);

/** @type {import("webpack").Configuration} */
module.exports = {
  mode: 'production',
  target: 'node',
  devtool: false,
  entry: {
    ['v8-compile-cache']: `v8-compile-cache`,
    ['pmm']: './src/index.ts',
    ['pmm-cli']: './src/pmm-cli.ts',
  },
  output: {
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
    new webpack.BannerPlugin({
      entryOnly: true,
      banner: `#!/usr/bin/env node\n/* eslint-disable */`,
      raw: true,
    }),
  ],
};
