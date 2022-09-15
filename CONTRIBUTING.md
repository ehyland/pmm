# Contributing to `pmm` <!-- omit in toc -->

- [Setup](#setup)
- [Building `pmm`](#building-pmm)
- [Running tests](#running-tests)
- [Manual Testing in development](#manual-testing-in-development)
- [Creating a production release](#creating-a-production-release)

> **Note: Draft document**

## Setup

Install [`docker`](https://docs.docker.com/get-docker/) & [`docker-compose`](https://docs.docker.com/compose/install/) >= v2 for running e2e tests.

Install dependences

```shell
pnpm i
```

## Building `pmm`

```shell
# Create a production build of pmm once
pnpm build

# Create a development build in watch mode
pnpm build:watch

# Build and release to local registry in watch mode. (start a local registry with docker-compose up -d registry)
pnpm build:watch:release
```

## Running tests

```shell
# Run unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run e2e tests
pnpm test:e2e

# Run e2e tests in watch move (run second command in another terminal)
pnpm test:e2e:watch
pnpm build:watch:release
```

## Manual Testing in development

```shell
# Build pmm
pnpm build

# Run the locally built executables
./bin/pmm
./bin/pnpm
./bin/yarn
./bin/npm
```

## Creating a production release

Versioning is managed via [changesets](https://github.com/changesets/changesets).

**To create a release**

1. Create a feature branch
2. Create a changeset describing the change with `pnpm add-change`
   Note: you can edit the changeset file in `.changeset/*`
3. Commit the changeset file to your feature branch
4. Raise a pull request
5. Once merged, the changeset action will create a new version
