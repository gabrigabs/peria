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
| SDK | `@peria/sdk` | Future |

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

## Step 6: Publish @peria/cli

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

## Step 7: Test the Installation

From a fresh directory:

```sh
# Test CLI installation
npx @peria/cli --help

# Or with npm
npm install -D @peria/cli
npx peria --help
```

## Versioning Strategy

For experimental releases, use:

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

As of Phase 8 completion:
- Package metadata is prepared ✅
- Build works ✅
- CLI binary works ✅
- Core, renderer, and CLI are the publishable packages for the first npm release ✅
- SDK and API Reference remain future package targets

To publish when ready:
```sh
bun run build
npm pack --pack-destination /tmp packages/core packages/renderer packages/cli
# Test tarball installation
cd /tmp && npm install peria-core-*.tgz peria-renderer-*.tgz peria-cli-*.tgz
npx peria --help
# If tests pass, publish:
cd packages/core && npm publish --access public
cd packages/renderer && npm publish --access public
cd packages/cli && npm publish --access public
```
