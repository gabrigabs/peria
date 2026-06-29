# Peria CLI

Local-first source-backed knowledge graph CLI for backend and API repositories.

## Features

- **`peria scan`** - Scan repository and generate manifest
- **`peria check`** - Run drift detection checks
- **`peria build`** - Build documentation site
- **`peria serve`** - Serve documentation locally
- **`peria github auth status`** - Diagnose which GitHub credential source Peria will use
- **`peria github cache write`** - Persist `.peria/github.json` from the scanned manifest
- **`peria github issues create-from-check`** - Draft cached issues from drift findings
- **`peria init`** - Initialize Peria in a new project

## Installation

```bash
npm install -D @peria/cli
# or
bun add -D @peria/cli
```

## Usage

### Initialize a new project

```bash
peria init
```

### Scan repository

```bash
peria scan
```

### Check for drift

```bash
peria check
peria check --json
peria check --severity error
```

### Build documentation

```bash
peria build
```

### Serve documentation

```bash
peria serve
peria serve --port 3000
```

### GitHub provenance

```bash
peria github auth status
peria github cache write
peria github issues create-from-check --label team-docs
```

`github cache write` reads `.peria/manifest.json` and writes `.peria/github.json` with typed GitHub entities and graph relations. It does not call GitHub or store tokens.

`github issues create-from-check` runs drift checks, deduplicates findings by fingerprint, and writes open issue records to the same cache. `peria build` includes those open issues in the generated wiki when `.peria/github.json` exists.

## Options

| Command | Options | Description |
|---------|---------|-------------|
| `scan` | `--cwd` | Working directory |
| `check` | `--json`, `--severity` | Output format and severity filter |
| `build` | `--output` | Output directory |
| `serve` | `--port`, `--open` | Server options |
| `github` | `auth status`, `auth login`, `cache write`, `issues create-from-check` | Auth diagnostics, provenance cache, and cached drift issues |

## Configuration

Create a `peria.config.ts` file:

```typescript
import { defineConfig } from '@peria/core';

export default defineConfig({
  framework: 'nestjs',
  features: {
    audit: true,
    contextPacks: true,
    diagrams: true,
  },
});
```

## License

MIT
