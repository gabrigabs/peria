# Publishing Peria to npm

This guide covers publishing Peria packages to the npm registry.

## Prerequisites

1. **npm account** - Create one at [npmjs.com](https://www.npmjs.com)
2. **2FA enabled** - Required for publishing. Enable in npm account settings.
3. **npm login** - Logged in locally:
   ```sh
   npm login
   ```
4. **Ownership verification** - Either:
   - Your npm username/org owns the package name, OR
   - You're added as a maintainer to the existing package

## Package Names

The monorepo uses scoped packages (`@peria/*`):

| Package | Full Name | Status |
|---------|-----------|--------|
| CLI | `@peria/cli` | Primary install target |
| Core | `@peria/core` | Dependency |
| Renderer | `@peria/renderer` | Dependency |
| Adapters | `@peria/adapters` | Published ✅ |
| SDK | `@peria/sdk` | Experimental |

## Current Published Versions

Verified on 2026-06-29:

| Package | npm version | Local manifest |
|---------|-------------|----------------|
| `@peria/core` | `0.1.1` | `0.1.1` |
| `@peria/cli` | `0.1.2` | `0.1.2` |
| `@peria/renderer` | `0.1.1` | `0.1.1` |
| `@peria/adapters` | `0.1.1` | `0.1.1` |

Do not publish `@peria/sdk` or `@peria/api-reference` until their public contracts are stable and covered by external-consumer tests.

## Step 1: Reserve the @peria Organization (One-time)

1. Go to [npmjs.com/org/create](https://www.npmjs.com/org/create)
2. Create organization: `peria`
3. Choose plan (free tier works for public packages)
4. Add yourself as a member

## Step 2: Verify Package Names Available

Check if the package names are available:

```sh
npm view @peria/cli 2>&1 | head -5
npm view @peria/core 2>&1 | head -5
npm view @peria/renderer 2>&1 | head -5
```

If they don't exist, you'll be the first publisher.

## Step 3: Build Before Publishing

Always publish from a clean build:

```sh
# Clean and rebuild
bun run build

# Verify the package contents
ls packages/cli/dist/
ls packages/core/dist/
ls packages/renderer/dist/
```

## Step 4: Publish @peria/core First

Core must be published before renderer and CLI (both depend on it):

```sh
cd packages/core

# Dry run (optional) - see what would be published
npm pack --dry-run

# Publish
npm publish --access public

# Verify
npm view @peria/core
```

## Step 5: Publish @peria/renderer

Renderer must be published before CLI (CLI depends on it):

```sh
cd packages/renderer

# Version must match core and CLI

# Dry run
npm pack --dry-run

# Publish
npm publish --access public

# Verify
npm view @peria/renderer
```

## Step 6: Publish @peria/adapters

Adapters can be published after their framework smoke tests pass:

```sh
cd packages/adapters

# Dry run
npm pack --dry-run

# Publish
npm publish --access public

# Verify
npm view @peria/adapters
```

## Step 7: Publish @peria/cli

```sh
cd packages/cli

# Version must match core and renderer

# Dry run
npm pack --dry-run

# Publish
npm publish --access public

# Verify
npm view @peria/cli
```

## Step 8: Test the Installation

From a fresh directory:

```sh
# Test CLI installation
npx @peria/cli --help

# Or with npm
npm install -D @peria/cli
npx peria --help
```

### Latest Published Fresh Install Check

Verified on 2026-06-29 in a temporary npm project outside the monorepo:

- `npm install -D @peria/cli@latest` installed without workspace links.
- `npx peria --help` exited successfully.
- `npx peria --version` returned `peria/0.1.2`.
- `npx peria scan`, `npx peria build`, a second `npx peria scan`, and `npx peria check --json` completed.
- `peria check --json` returned `passed: true` with one informational stale-page finding for `docs/index.html`, which reflects the currently published static renderer. The local branch now replaces that path with Fumadocs-compatible output.

`peria init` remains interactive and should be validated manually or with a TTY harness before marking init dogfood fully automated.

The repeatable npm dogfood command is:

```sh
bun run dogfood:npm
```

It installs `@peria/cli@latest` in a temporary project, copies the NestJS fixture, runs `scan`, `build`, `scan`, and `check --json`, and validates generated artifacts without workspace links.

The repeatable local NestJS adapter dogfood command is:

```sh
bun run dogfood:nest
```

It packs the local `@peria/core`, `@peria/renderer`, `@peria/cli`, and `@peria/adapters` packages into a temporary NestJS fixture, generates Fumadocs output, compiles and starts the app, then validates `/docs`, `/docs/wiki-manifest.json`, `/docs/llms.txt`, a generated MDX artifact, a global API prefix, a docs subpath, and common missing/unreadable docs errors.

## Versioning Strategy

Until changesets or release automation exist, versioning is manual and must follow this policy:

1. Check npm before editing manifests:
   ```sh
   npm view @peria/core version
   npm view @peria/renderer version
   npm view @peria/adapters version
   npm view @peria/cli version
   ```
2. Bump each package that will be published to a version greater than npm.
3. Update internal published dependencies before packing:
   - `@peria/cli` depends on the published `@peria/core` and `@peria/renderer` versions.
   - `@peria/renderer` depends on the published `@peria/core` version.
4. Run `bun install` so `bun.lock` reflects the manifest changes.
5. Run build, typecheck, tests, and `npm pack --dry-run` for every publishable package.
6. Publish dependencies first, then dependents.

For experimental semver, use:

```
0.0.1  - First experimental
0.0.x  - Bug fixes
0.1.0  - First minor release with features
0.x.0  - Breaking changes
```

## npm Scripts Available

```sh
# Build (used by prepublishOnly)
bun run build

# Or manually
npm run prepublishOnly
```

## Common Issues

### "You do not have permission to publish"

- Not logged in: `npm login`
- Package owned by someone else: choose different name
- 2FA not enabled on npm account

### "E400 Bad Request"

- Scoped package needs `--access public`
- Package version already published: bump version

### "You cannot publish over the previously published versions"

- Can't re-publish same version
- Bump version in package.json first

## Post-Publish Checklist

- [ ] Verify on npmjs.com
- [ ] Test `npx @peria/cli --help`
- [ ] Update README with install instructions
- [ ] Announce (optional)

## Continuous Publishing (Future CI)

For automated releases via GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then in GitHub Settings > Secrets, add `NPM_TOKEN` with an npm automation token.

## Current Status

As of 2026-06-29:

- Package metadata is reconciled with npm for `@peria/core`, `@peria/cli`, `@peria/renderer`, and `@peria/adapters`.
- Build and typecheck pass locally.
- CLI binary works from the built package.
- Core, renderer, adapters, and CLI are the current publishable packages.
- SDK and API Reference remain future package targets.

To publish when ready:
```sh
bun run build
npm pack --pack-destination /tmp packages/core packages/renderer packages/adapters packages/cli
# Test tarball installation
cd /tmp && npm install peria-core-*.tgz peria-renderer-*.tgz peria-adapters-*.tgz peria-cli-*.tgz
npx peria --help
# If tests pass, publish:
cd packages/core && npm publish --access public
cd packages/renderer && npm publish --access public
cd packages/adapters && npm publish --access public
cd packages/cli && npm publish --access public
```
