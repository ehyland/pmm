import * as inspector from './inspector';

const versionMatcher = expect.stringMatching(/^\d+\.\d+\.\d+$/);

describe('inspector', () => {
  describe('findPackageManagerSpec()', () => {
    it('works', async () => {
      const { spec } = (await inspector.findPackageManagerSpec()) ?? {};
      expect(spec).toEqual({
        name: 'pnpm',
        version: versionMatcher,
      });
    });
  });
});
