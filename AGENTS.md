# AGENTS.md

Instructions for AI agents working with Peria codebases.

---

## Core Value

Peria compiles technical knowledge from code into a traceable wiki. The key questions it answers:

1. **What is this?** (Entity identification)
2. **Why does it exist?** (Provenance — which commit, issue, ADR)
3. **What changed it?** (Change history)
4. **What will break if I change it?** (Impact analysis)

---

## Claim Quality Standards

Every extracted piece of information should be:

1. **Verifiable** — Can be traced back to a source file
2. **Specific** — "Uses JWT with RS256" not "Uses auth"
3. **Dated** — Has a timestamp or version context
4. **Linked** — Connected to related entities

**Bad claim:** "This API uses authentication"
**Good claim:** "POST /auth/login returns a JWT access token (RS256) valid for 15 minutes, added in commit abc123 to fix issue #89"

---

## Entity Resolution

When you encounter the same concept in different sources:

- `UserService` in code → `user-service` in OpenAPI → "User Service" in docs
- These are the SAME entity
- Create canonical name from the source (prefer code name)
- Link all references to single entity

---

## Graph Building

Build relationships explicitly:

```
Endpoint ──changed_by──▶ PR #247
Endpoint ──documented_in──▶ docs/auth.md
Endpoint ──implements──▶ AuthSpec
PR #247 ──fixes──▶ Issue #189
Issue #189 ──reported_by──▶ @developer
```

---

## Contribution Guidelines

### Workflow

1. **Fork & branch** — Create a feature branch from `main`
2. **Implement** — Write code following these guidelines
3. **Test** — Add tests for new functionality
4. **Document** — Update docs if behavior changed
5. **PR** — Submit with clear description

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add GitHub integration for PR sync
fix: resolve race condition in config loader
docs: update README with new adapters
refactor: extract framework detection into separate module
test: add tests for entrypoint detection
chore: update dependencies
```

### Code Style

- **Explicit over implicit** — Clear naming, no magic
- **Small functions** — Single responsibility, max ~50 lines
- **Dependency injection** — For testability
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

## Validation Checklist

Before submitting changes, verify:

- [ ] TypeScript compiles without errors (`bun run typecheck`)
- [ ] All packages build successfully (`bun run build`)
- [ ] New features have tests
- [ ] CLI commands have `--help` text
- [ ] Error messages are actionable
- [ ] No hardcoded values (use config)
- [ ] Changes traced in CLAUDE.md if architecture affected
- [ ] Conventional commits used

---

## Important Rules

### DO

- Trace every claim to a source
- Use conventional commits
- Write tests for parsers and extractors
- Keep functions small and focused
- Document complex logic
- Add JSDoc for public APIs
- Handle errors gracefully with actionable messages

### DON'T

- Generate claims without provenance
- Skip tests for "obvious" code
- Make assumptions about project structure
- Add dependencies without justification
- Optimize for AI at the expense of human readability
- Use `any` type without a comment explaining why
- Leave TODO comments without linking to an issue

---

## Tech Stack

- **Runtime:** Bun (CLI), Node.js >= 20 compatible
- **Language:** TypeScript strict mode
- **Package Manager:** Bun workspaces
- **Build:** tsup
- **CLI Framework:** CAC
- **Prompts:** @clack/prompts
- **Code Analysis:** ts-morph (future)
- **Markdown:** unified/remark/rehype (future)

---

## TypeScript Conventions

```typescript
// Good: explicit types, named exports
export interface Config {
  framework: Framework
  features: FeatureFlags
}

export function loadConfig(path: string): Promise<Config> {
  // ...
}

// Good: discriminated unions for state
type State =
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; error: Error }

// Good: branded types for safety
type AbsolutePath = string & { __brand: 'AbsolutePath' }
```

---

## Testing Conventions

```typescript
// Test file naming
src/detectors/framework.ts → tests/detectors/framework.test.ts

// Test structure
describe('detectFramework', () => {
  it('detects NestJS from package.json', async () => {
    // Arrange
    const cwd = '/path/to/nestjs-project'

    // Act
    const result = await detectFramework(cwd)

    // Assert
    expect(result?.framework).toBe('nestjs')
  })
})
```

---

## Error Handling

```typescript
// Good: actionable error messages
throw new Error(
  `Could not find package.json in ${cwd}. ` +
  `Make sure you are running peria from your project root.`
)

// Good: structured errors
class ConfigError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'INVALID' | 'PARSE_ERROR'
  ) {
    super(message)
    this.name = 'ConfigError'
  }
}
```
