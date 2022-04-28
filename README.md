# 📦 PMM - _NodeJS_ Package Manager Manager

Just like corepack, plus

🔥 &nbsp; `pmm update-local` update `packageManager` for your local project

🔥 &nbsp; `pmm update-default <package-manager> [version]` update the global fallback version

🔥 &nbsp; Installs package managers from configurable registry with `PMM_PACKAGE_PATH`

What's missing

⏲️ &nbsp; No `yarn` support (coming soon, on request)

⏲️ &nbsp; No Windows support (will consider, on request)

> ⚠️ &nbsp; This is early release. There are more feature to add, edges to smooth. But it's already a delight to use

## Install

```shell
curl -o- https://raw.githubusercontent.com/ehyland/pmm/main/install.sh | bash
```

## Usage

Add `packageManager` field to your projects `package.json`.

e.g.

```json
{
  "packageManager": "pnpm@6.32.11"
}
```

Then use your package manager as you usually would. Behind the scenes, `pmm` will automatically install and run the package manager version in your `package.json`.

The first time you run `npm` or `pnpm` outside of a configured project / in a global context, pmm will get the latest version of your package manager and set it as the global default. The default can then be updated with `pmm update-default <package-manager> [version]`.

## Uninstall

Simply remove the `~/.pmm` dir and the enabling script in your `~/.bashrc`

```shell
export PMM_DIR="$HOME/.pmm"
[ -s "$PMM_DIR/package/enable.sh" ] && \. "$PMM_DIR/package/enable.sh"  # This loads pmm shims
```
