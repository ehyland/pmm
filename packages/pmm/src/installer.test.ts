import * as installer from './installer';
import fs from 'node:fs/promises';
import { PackageManagerSpec } from './spec';

jest.setTimeout(10 * 10000);

const versionMatcher = expect.stringMatching(/^\d+\.\d+\.\d+$/);

describe('installer', () => {
  describe('install', () => {
    describe('pnpm', () => {
      it('works', async () => {
        const spec: PackageManagerSpec = {
          name: 'pnpm',
          version: '6.32.9',
        };
        const installPath = installer.getInstallPath(spec);

        // expect download
        const result1 = await installer.install({
          spec,
          skipCache: true,
        });

        expect(result1.usedCache).toBe(false);

        // expect cache
        const result2 = await installer.install({
          spec,
        });

        expect(result2.usedCache).toBe(true);

        // expect download again
        await fs.rm(installPath, { force: true, recursive: true });
        const result3 = await installer.install({
          spec,
        });

        expect(result3.usedCache).toBe(false);
      });
    });
    describe('npm', () => {
      it('works', async () => {
        const spec: PackageManagerSpec = {
          name: 'npm',
          version: '8.0.0',
        };
        const installPath = installer.getInstallPath(spec);

        // expect download
        const result1 = await installer.install({
          spec,
          skipCache: true,
        });

        expect(result1.usedCache).toBe(false);

        // expect cache
        const result2 = await installer.install({
          spec,
        });

        expect(result2.usedCache).toBe(true);

        // expect download again
        await fs.rm(installPath, { force: true, recursive: true });
        const result3 = await installer.install({
          spec,
        });

        expect(result3.usedCache).toBe(false);
      });
    });
  });

  describe('getLatestVersion()', () => {
    it('works for pnpm', async () => {
      const result1 = await installer.getLatestVersion('pnpm');

      expect(result1).toEqual({
        version: versionMatcher,
      });
    });
  });
});
