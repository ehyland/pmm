import * as installer from './installer';
import { PackageManagerSpec } from './spec';
import * as filesystem from './filesystem';
import * as registry from './registry';
import { PackageJson } from '@npm/types';

jest.setTimeout(10 * 10000);

jest.mock('./filesystem');
jest.mock('./registry');

const { mocked } = jest;

const pkg: PackageJson = {
  name: 'mock-package',
  version: '0.0.0',
};
const spec: PackageManagerSpec = {
  name: 'pnpm',
  version: '0.0.0',
};
const missingPackageError = new Error(`💣 unable to read package`);

let cachedPkg: PackageJson | undefined;

describe('installer', () => {
  let result: Awaited<ReturnType<typeof installer.install>>;

  beforeEach(() => {
    cachedPkg = undefined;
    jest.resetAllMocks();
    mocked(filesystem).readPackageFromCache.mockImplementation(
      async (_spec: any, { throwOnMissing = false } = {}) => {
        if (!cachedPkg && throwOnMissing) throw missingPackageError;
        return cachedPkg;
      }
    );
    mocked(registry).downloadPackage.mockImplementation(async () => {
      cachedPkg = pkg;
    });
  });

  describe('install', () => {
    describe('when pm exists in cache', () => {
      beforeEach(async () => {
        cachedPkg = pkg;
        result = await installer.install({ spec });
      });

      it('returns cached result', () => {
        expect(result).toEqual({ usedCache: true });
      });

      it('does not attempt to download the package', () => {
        expect(registry.downloadPackage).not.toHaveBeenCalled();
      });
    });

    describe('when pm does not exists in cache', () => {
      beforeEach(async () => {
        cachedPkg = undefined;

        result = await installer.install({ spec });
      });

      it('returns installed result', () => {
        expect(result).toEqual({ usedCache: false });
      });

      it('downloads the package', () => {
        expect(registry.downloadPackage).toHaveBeenCalledWith(spec);
      });

      it('validates that package exists', () => {
        expect(filesystem.readPackageFromCache).toHaveBeenCalledWith(spec, {
          throwOnMissing: true,
        });
      });
    });

    describe('when pm is downloaded but can not be read', () => {
      let errorResult: any;
      beforeEach(async () => {
        cachedPkg = undefined;
        mocked(registry).downloadPackage.mockImplementation(async () => {
          cachedPkg = undefined;
        });
        errorResult = await installer.install({ spec }).then(
          () => {
            throw new Error('expected function to ');
          },
          (error) => error
        );
      });

      it('throws error', () => {
        expect(errorResult).toBe(missingPackageError);
      });
    });
  });
});
