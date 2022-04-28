import * as inspector from './inspector';

describe('inspector', () => {
  describe('findPackageManagerSpec()', () => {
    it('works', async () => {
      const spec = await inspector.findPackageManagerSpec();
      expect(spec).toEqual({
        name: 'pnpm',
        version: '6.32.9',
      });
    });
  });
});
