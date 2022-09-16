---
'@ehyland/pmm': patch
---

Allow alternative package manager to be called in child process

Use case:

With `pnpm changeset publish` , changesets CLI will attempt to run npm tp get npm configuration. This should not be blocked by pmm in a project that is configured to use pnpm
