declare module 'npm-pick-manifest' {
  import type { PackageJson } from 'type-fest';

  export type Content = PackageJson & {
    packageManager?: string;
    dist: Record<string, string | undefined>;
  };

  declare function pickManifest(packument: any, spec: string): Content;

  export default pickManifest;
}
