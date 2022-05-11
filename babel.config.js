module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 12 } }],
    '@babel/preset-typescript',
  ],

  // overrides: [
  //   {
  //     include: [
  //       './packages/css',
  //       './packages/dynamic',
  //       './packages/private',
  //       './packages/recipes',
  //       './packages/sprinkles',
  //       './packages/utils',
  //     ],
  //     presets: [['@babel/preset-env', { targets: { esmodules: true } }]],
  //   },
  // ],
};
