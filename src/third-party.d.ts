declare module "@npmcli/package-json" {
  import type { PackageJson } from "type-fest";

  export type Content = PackageJson & { packageManager?: string };

  declare class NPMCliPackageJson {
    constructor(path: string);

    static load: (path?: string) => Promise<NPMCliPackageJson>;
    save: () => Promise<void>;
    update: (content: Content) => void;

    content: Content;
  }

  export type { PackageJson } from "type-fest";
  export default NPMCliPackageJson;
}
