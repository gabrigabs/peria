# Contributing to Peria

Thank you for your interest in contributing to Peria! This guide covers everything you need to know.

---

## Development Setup

```bash
# Clone and install
git clone https://github.com/your-fork/peria.git
cd peria
bun install

# Build all packages
bun run build

# Type check
bun run typecheck
```

---

## Workflow

1. **Fork & branch** — Create a feature branch from `main`
2. **Implement** — Write code following our conventions
3. **Test** — Add tests for new functionality
4. **Document** — Update docs if behavior changed
5. **PR** — Submit with clear description

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add GitHub integration for PR sync
fix: resolve race condition in config loader
docs: update README with new adapters
refactor: extract framework detection into separate module
test: add tests for entrypoint detection
chore: update dependencies
```

---

## Code Style

- **Explicit over implicit** — Clear naming, no magic
- **Small functions** — Single responsibility, max ~50 lines
- **Async/await** — Over callbacks
- **Strict TypeScript** — No `any`, proper types

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `code-map.ts`, `github-client.ts` |
| Types/Classes | PascalCase | `Entity`, `Claim`, `ConfigLoader` |
| Functions/Variables | camelCase | `extractEntities`, `currentVersion` |
| Constants | SCREAMING_SNAKE | `DEFAULT_FEATURES`, `MAX_RETRIES` |

---

## Tech Stack

- **Runtime:** Bun, Node.js >= 20
- **Language:** TypeScript strict mode
- **Package Manager:** Bun workspaces
- **Build:** tsup
- **CLI Framework:** CAC + @clack/prompts

---

## Validation Checklist

Before submitting, verify:

- [ ] TypeScript compiles (`bun run typecheck`)
- [ ] All packages build (`bun run build`)
- [ ] New features have tests
- [ ] CLI commands have `--help` text
- [ ] Error messages are actionable
- [ ] No hardcoded values (use config)
- [ ] Conventional commits used

---

## Important Rules

### DO

- Keep functions small and focused
- Document complex logic
- Add JSDoc for public APIs
- Handle errors gracefully with actionable messages

### DON'T

- Use `any` type without a comment explaining why
- Add dependencies without justification
- Leave TODO comments without linking to an issue

---

## Packages

| Package | Purpose |
|---------|---------|
| `packages/core` | Types, config, detectors |
| `packages/cli` | CLI commands |
| `packages/sdk` | Programmatic SDK |
| `packages/adapters` | Framework adapters |
| `packages/docs-ui` | Documentation UI |

---

## Questions?

Open an issue for bugs, feature requests, or questions.
