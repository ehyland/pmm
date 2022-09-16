# @ehyland/pmm

## 0.8.1

### Patch Changes

- 6018758: Allow alternative package manager to be called in child process

  Use case:

  With `pnpm changeset publish` , changesets CLI will attempt to run npm tp get npm configuration. This should not be blocked by pmm in a project that is configured to use pnpm

## 0.8.0

### Minor Changes

- 377b5f7: Suggest setting PMM_NPM_REGISTRY in install script

## 0.7.0

### Minor Changes

- 8751d77: Add `pmm pin <name> <path>` command

## 0.6.0

### Minor Changes

- 4249487: Add npx & pnpx shims

## 0.5.0

### Minor Changes

- d7933e5: Add pmm update-self command

## 0.4.0

### Minor Changes

- 362ccc6: Add yarn support

## 0.3.1

### Patch Changes

- b215a6a: fix: fetch full packument to get latest version

## 0.3.0

### Minor Changes

- ba03e7f: Improve pmm update-local logging

## 0.2.6

### Patch Changes

- 032e368: fix update-local command
