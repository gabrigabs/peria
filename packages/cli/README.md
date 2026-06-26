# Peria CLI

Local-first source-backed knowledge graph CLI for backend and API repositories.

## Features

- **`peria scan`** - Scan repository and generate manifest
- **`peria check`** - Run drift detection checks
- **`peria build`** - Build documentation site
- **`peria serve`** - Serve documentation locally
- **`peria init`** - Initialize Peria in a new project

## Installation

```bash
npm install -D @peria/cli
# or
pnpm add -D @peria/cli
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

## Options

| Command | Options | Description |
|---------|---------|-------------|
| `scan` | `--cwd` | Working directory |
| `check` | `--json`, `--severity` | Output format and severity filter |
| `build` | `--output` | Output directory |
| `serve` | `--port`, `--open` | Server options |

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
